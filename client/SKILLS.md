# SKILLS.md — Elysium Development Recipes

> Step-by-step patterns for recurring development tasks, distilled from ~26 sessions of implementation. Each recipe lists the exact touch-points in the codebase and the order they must be done in. Read `CLAUDE.md` for the project overview and constraints. **B1 roundtrip, corrected recipe (12 July):** `split_client.py` reads `/tmp/original.html` and writes fragments to `/home/claude/elysium-src` — but `elysium-build.js` reads `ROOT/elysium-src` (next to the build script). ALWAYS: (1) `cp` the edited client to `/tmp/original.html`, (2) split, (3) `rm -rf elysium-src && cp -r /home/claude/elysium-src elysium-src`, (4) build to a SCRATCH file (`node elysium-build.js /tmp/rebuilt.html`) and `cmp` against the original — never trust the default-overwrite path: a stale fragment dir once produced a byte-identical FALSE PASS against pre-edit content. **Reflects Elysium v2.6.128 (client v2.6.163 / server v2.6.47 / bot v0.6.206 -- v2.6.163: a peer's string in HTML goes through `escapeHtml` (quotes included) and a text sink gets it raw; the harness HTML recorder tests what renderers write; B1 copies the client to /tmp/original.html first; v2.6.162: a real bot driven through its verdict wait in headless Chromium (wait for the bot's own deal before touching its board; a bot's lines after a question wait 1.6 × paceMs, so measure its decision and its line apart), the play-test report's clock column; v2.6.161: touch in headless Chromium (a tap and a real long-press), a view measured from every way in, and how to see that frames stalled; v2.6.160: a control beside every 'nothing happens' browser check (the eye's wheel vs the mat's), Esc goes Home in a script; v2.6.159: the hotseat bridge must stay LIFTABLE (the bot project cuts it verbatim; a suite test pins it -- see 'The hotseat bus'), and a browser run at a hotseat with bots goes ⌂ Home before reacting on your own minion (the camera is on the acting bot -- see the headless Chromium recipe); v2.6.158: what the play-test found -- the default combatant expires, one image fallback, a master on a vampire counts, the level chooser follows the anchor, and the play-test rig (recipe below); v2.6.157: a second room option (`tableLayout`) followed the room-wide-setting recipe, and the client sets the geometry it drives wherever the value arrives, before a deal; v2.6.149: a pub field (`tn`/`rn`) went through "Add a field to the public board" only after the real-server run found the whitelist -- open that recipe BEFORE designing; 13 Oct, no code: the recipe "Review the other half's code path against ours"; v2.6.148: the arrival runs and frame counting, added to "Drive the real server with real browser clients"; v2.6.147: an icon button that turns -- see "Judge a small icon on the pixel grid" under the browser recipe; v2.6.146: a ROOM OPTION the server only stores (`tableSetup`) -- the checked list under "Add a room-wide setting"; the real server with real browser clients -- see "Drive the real server with real browser clients"; v2.6.142: the consume recipe drives the client's mirrors of bot rules (the hold badge) against the real bot; v2.6.141: the consume recipe notes partial 'changed today' zips; v2.6.140: consuming a bot release has its own recipe, "Consume a bot release"; v2.6.139: a TABLE-STATE verb (botcfg) -- see the new recipe "Add a table-state verb"; the room snapshot is ONE pure pair (roomSnap / roomUnsnap); v2.6.128: the Help modal's ids are helpDoc*, a duplicate-id suite pin; HELP INSIDE THE CLIENT 22 Sep: Help… submenu, START-HERE pages embedded as <template>s + embed-help.js; BOT-CARD CONTROLS 22 Sep: card verbs on a bot seat ride the bridge too, see "Referee verbs on a bot seat"; THE PARITY ROUND 21 Sep: hotBridge owns the server's table state (tally / out / VP) -- see the new recipe "Mirror a server handler in hotBridge"; LITE MODE 9 Sep: the Lite/Full interface mode (see the new recipe "Gate a feature by interface mode (Lite/Full)"), the card database on by default, Tournament lock always on (its checkbox left Create game at v2.6.116), the alpha pill on bot seats. Prior rounds in elysium-CHANGELOG.md.)**

## Add a table-state verb (store + relay + late-join replay + snapshot) — v2.6.139 (`botcfg`), the pattern `tally` started
A piece of state the whole TABLE shares (the bot tempo, the resolver counters) needs five places, and missing one is silent:
1. **Server merge rule** as a pure function (`botcfgMerge(field1, field2, prev)`): validate each field, an ABSENT or invalid field keeps `prev`'s value (the v2.6.17 rule — partial writes), a table with nothing stored merges onto a named default, nothing valid → `null` (store nothing, send nothing). Read the fields as `m.x` IN THE HANDLER BODY and pass them in — the protocol lint sees `m.x`, not a helper's reads.
2. **Server handler**: gate (who may), merge onto `room.<state>`, store WITH the setter's name, `bcast` the WHOLE state to everyone incl. the sender (an idempotent echo).
3. **Late joiners**: `joinReply` sends the stored state right after `joined` — BEFORE the lobby return when the state matters in the lobby (bots are added there).
4. **Snapshot**: add the field to `roomSnap` AND `roomUnsnap` (re-validate on the way back in), and to the round-trip test's list.
5. **Twins**: the client's merge (`botCfgMerge`) for its MP handler, and `hotBridge`'s (`botcfgIn`, SELF-CONTAINED — the bot project lifts the literal; `reset()` clears it; the `join` case replays it after `joined`). One suite test drives server + client + bridge with ~400 random partial writes and a coverage guard (enough partial and ignored writes, or the twin proves nothing).
Then: the protocol doc (§7 + §8 rows, index blocks, the §3 replay note), the handler counts (both suites + `check-versions.js`), and the client's write path (gate with a reason, PARTIAL on the wire, one log line from the sender, optimistic local merge). A default that must be TRUE for the bots needs a seed (the bridge at spawn, the host online) — a value only shown in a panel is not a value the bots got.

## Play-test a change for real (the play-test rig) — v2.6.158
A full game in a real browser, one human against the bots, recorded and measured (`client/playtest/PLAYTEST.md` is the long form).
1. **Pick the folder:** the root (the release) by default; `--dir client` for an unreleased client with the bot bundle copied beside the suite. No internet: `--vtes <a local KRCG vtes.json, never committed> --offline`.
2. **Start:** `node client/playtest/playtest-rig.js --out <run dir> &`, then `node client/playtest/playtest.js setup [scenario.json]` (room, the human's deck, the bots in seat order, tempo, the reflex) and `node client/playtest/playtest.js smoke` to prove the rig (first turn + every bot turn, no page error).
3. **Play** with the CLI (`phase`, `influence`, `out`, `play --by/--on [--alt Superior]`, `menu <card> 'Actions>Bleed>Bleed 3'`, `chat +1`, `resolve`, `say <phrase>`, `clear`, `pass`); follow with `ev <wait>`. Standard tempo: the reflex answers for the human (`pol`), say which waits ended in your holds (rig v1.1.0: after the bot's question for that very step, or once the wait's clock has started -- bot v0.6.204+ starts it when the question is sent; v1.0.0 answered queued questions). Turn-based: `pol '{"on":false}'`, `give` is the play button.
4. **The human's own values are the human's** (Johan, 14 Oct): pay card costs, take combat damage off your vampires (the 'takes N' line is a report), take the Edge, burn pool for others' effects, book stealth/intercept on the counter.
5. **Report:** `node client/playtest/playtest-report.js <run dir>` (turns, pacing, waits and question lag, double speech, combat silence, the bots' wait rows; rig/report v1.1.0: `clock` = question → the wait's clock, negative when the clock ran before the question -- with bot v0.6.204+ it sits at 0–0.35 s, one panel sample). Bot findings → `docs/handoffs/REPLY-to-bot-<date>-playtest.md` with timestamps; ours → the journal and a fix round, each pinned by a test that fails on the previous client. Keep runs out of git (`playtest/runs/` is ignored).

## Work in the monorepo (12 Oct 2026)
The project lives in https://github.com/dtagent2000/VTES-Elysium: `/` = the download (byte copies of releases), `client/` = this project, `client/docs/` = its docs, `bot/` = the bot project (read, never write). One round:
1. `git checkout -b <topic> main`. Read `client/docs/START-HERE-CLIENT-CHAT.md`, `client/CLAUDE.md`, the newest journal/context/learnings entries.
2. **Bundle beside the suite:** `cd client && cp ../elysium-bot.js ../elysium-cardfx.js ../elysium-cardfx.json ../elysium-twd-profile.js ../elysium-twd-profile.json ../elysium-twd-archetypes.js ../elysium-twd-archetypes.json ../START-HERE-BOTS.html .` (gitignored by `client/.gitignore`; never commit a third copy). A bot release reaches us as their PR copying the bundle to the root — the root is the consume source now, a zip is the exception.
3. Change `client/` only; version = bytes; gates from `client/` (`node check-versions.js` first and last — its final row asserts the root is a byte copy of the halves; outside a monorepo checkout the row is absent).
4. Living docs in `client/docs/` + `client/CLAUDE.md` + this file. Our replies to the bot project: `client/docs/handoffs/REPLY-to-bot-<date>-<topic>.md`; their asks: `bot/docs/handoffs/HANDOFF-to-main-*.md`.
5. A release: copy `elysium-vtes-bord.html`, `elysium-server.js`, the start scripts, `START-HERE.html`, `Elysium_-_Host_Guide.docx` from `client/` to `/`; `check-versions.js` green; bump the version block in `START-HERE-CLIENT-CHAT.md`.
6. Commit (English; what + why; the attribution trailers the session asks for), `git fetch origin main` (rebase if moved), push, `gh pr create --base main`. Johan merges and deploys. Delete `elysium-rooms.json` / `elysium-saves.json` after live probes (gitignored, but a stale one breaks the next probe).

## Consume a bot release (a handoff from Elysium Bots) — v2.6.140
The bot project ships a zip and a handoff; main consumes, never edits. In this order:
1. **In the monorepo (12 Oct 2026):** their release is the bundle at the root — copy it beside the suite with the one-liner in "Work in the monorepo" and skip the unpack. For a zip: **Unpack into its own empty directory** (untrusted data) and copy BY NAME beside the suite: `elysium-bot.js`, `elysium-cardfx.json`, `elysium-twd-profile.json`, `elysium-twd-archetypes.json`, the `.js` twins (`elysium-cardfx.js`, `elysium-twd-profile.js`, `elysium-twd-archetypes.js` — the local-file vehicle, v0.6.195+), `test-bot-canary.js` if re-issued, `START-HERE-BOTS.html`. Never blanket-copy (27 July). A zip of 'everything changed today' leaves the unchanged files out — keep the previous release's copies (the twins included) and read the twin test's pair count. Before asking the other project a question, read their released code: it often answers.
2. **Version and bytes:** `grep -m1 "BOT_VERSION =" elysium-bot.js`; `cmp` each data file against the deployed copy — an identical file needs no purge.
3. **Run:** the client suite (the `testB` LIVE tests run only with the bot beside — read the summary's skip count: only the gated ones may skip, and a capability gate must say why), `node test-bot-canary.js`, `node elysium-soak-hotseat.js --control`. The suite's twin test checks each `.js` twin against its JSON.
4. **Embed their guide:** `node embed-help.js bots START-HERE-BOTS.html`, then `--check` (verbatim — their prose is theirs).
5. **Their asks:** build main's half, each pinned by a test that FAILS on the previously delivered client; check every claim about the client against the source first (their 'check on your side' items have found real bugs: v2.6.140's steal read-out). **Mirrors (v2.6.142):** where the client mirrors a bot rule (the hold badge `hotHoldBy` ↔ the bot's `_holdBy`), read their guide and changelog for that rule, then drive the real bot and the mirror through the same inputs in a LIVE test (`v2.6.142 LIVE`). A mirror tested only against itself stayed green for a month while the rule moved.
6. **Record:** PROJECT-MANIFEST §E2 (release, data files, twins, what ran beside the suite), the CHANGELOG's bot section, the runbook's §3b if a deploy artifact changed, and `REPLY-to-bot-<date>-v<bot>.md` (what was verified with numbers, what main changed, findings for them, open decisions for Johan).
7. **Deploy line:** client purge (+ server restart if srv changed); the bot files beside the server — purge only the URLs whose bytes changed; the `.js` twins into the download bundle (the server never serves them).

## Put another player's string into the page (v2.6.163)
1. **HTML string** (innerHTML, a log line, an attribute inside one): `esc(x)` / `escapeHtml(x)` — it escapes `& < > " '`.
   Attributes stay double-quoted (`attr="'+esc(x)+'"`); never build an inline handler (`onclick="…'+x+'…"`) from data.
2. **Text sink** (`toast`, `uiAlert`/`uiConfirm`/`uiDialog`, `el.textContent`, `el.title=`, a menu item's `label` —
   `renderItems` writes text): the RAW string — escaping there shows the entities (`O&#39;Neil`). A suite test refuses
   `toast(...esc(` and a `label` built with esc. Follow a value through its variables: the log link's `⋖ Target:` label
   was built two lines before the menu.
3. **CSS selector** (`querySelector('[data-cid="'+id+'"]')`): only ids, which the server makes id-shaped (`cleanId`).
4. **Server side** (defence for old tabs): names through `cleanName` (no `"`), card fields through `cleanCard` (no `=`,
   quotes kept), clans/paths through `cleanSym`, ids through `cleanId`. A new pub field picks one of the four. Anything
   loaded from disk (the room snapshot, the saves) is cleaned by the same rules as it loads (`roomUnsnap`, `saveUnsnap`),
   or a lookup by the cleaned name misses what was stored before.
5. **Test:** add the renderer to the `v2.6.163 XSS` test (payload peers, `R.__htmlRec.start()`, render, `stop()`, no
   raw `data-pwn="1`, plus a coverage assert that the escaped payload appears).

## Add or change a combat-helper control (v2.6.129)

The combat helper is the `cmb*` block (search "Step-driven combat helper"). One control = one function with TWO entry points:
1. **The function** (`cmbStrike` / `cmbManeuver` / `cmbPress` …): take the vampire `c` (default `cmbMyCard()`), ask any prompt FIRST (a cancelled prompt must open nothing), then `const side=cmbEnsure(c)` (opens combat + announces `c` if needed; null when the helper is off), then `log(CMB_LINE.x(...))`, then — only if `side` — `cmbSet({...})` with the fields that changed (a PARTIAL tally write). Auto-advance the stepper forward only (`if((avr.ph|0)<N) f.ph=N`).
2. **The menu row** in `cmbMenu(c)` (`noUndo:true`; `disabled` + `title` when the state forbids it) and **the panel button** in `cmbPanelCtl` (own side only, for the step it belongs to). Amounts come from `cmbNums(title, fn)` (1 2 3 4 N…), never a free-text prompt, and lines carry the EFFECT, never a card name (v2.6.134). The menu system has THREE levels: `Combat ▸ row ▸ number` is the deepest a right-click row can go.
3. **A new log line** goes into `CMB_LINE` (pure builder), into PROTOCOL §12, and into the `testB` that runs the released bot's regexes over the builders; a new shape the bot does not parse yet goes into the bot handover spec.
4. **A new shared field**: add it to `AVR_CMB0` AND `tallyCombatMerge` (client) AND `TALLY_CMB_KEYS` / `TALLY_CMB0` / `tallyCombat` (server) AND the PROTOCOL §7/§8 tally rows. The twin test and the protocol lint both fail until all four agree. Decide per field whether a NEW ROUND clears it (most do) or keeps it (`ea`/`eb`); that decision lives ONLY in the merge functions. `cmbNewRound` calls `tallyCombatMerge`, so never reset fields by hand (v2.6.135).
5. **Counting rules** (dodge, combat ends vs every-round damage, prevention, aggravated) live in `cmbSideDamage` / `cmbDealt` / `cmbEnvOf` / `cmbDodged` — the ONE place the taken line, the read-out, the history and the totals read. Never add a second sum (v2.6.136).
6. **Anything that must happen on a step transition** goes into `cmbWatch(prev, cur, resolved)` — it sees local steps, menu actions, remote tallies, open, clear and resolve. Detect STATE ("the damage round is behind us"), not one intermediate step: a sender's debounce can swallow it (v2.6.130).
8. **A real-bot combat (v2.6.133):** `v2.6.133 LIVE` shows the recipe. Seat the real bot through `HB.dialFor`, give Lisa a ready vampire and wait until `b2._seatOfVamp('Lisa')===1`, move a bot crypt card from `b2.unc` into `b2.board` as ready, set `net.turnSeat` + `b2._actingVamp` + `b2._lastBlockerName`, then `await b2._resolveCombat(bv,'Lisa')` while a loop plays Lisa's side through the `cmb*` functions. Use `phaseSecs: 1` to keep it fast.
9. **Resolver lifecycle (v2.6.137/138):** shared resolver state is closed on the WIRE by one owner — the actor when its action resolves (`resolvePlayedActions` → `tallySendNull`), the SERVER at every turn change (`turnTallyClear` before each `turn` broadcast, srv-2.6.42; the client's own `tallyStaleClose('turn', send)` stays for older servers), a new action for a finished combat (`actStart`). A local-only clear leaves the server and the bots with stale state. The Block counter is opened by the BLOCKER; anything the ACTOR must add (the undirected +1) is written by the actor when the counter appears (`blockSeedUndir`, local open and MP handler).
7. **UI touch-points (v2.6.132):** a combat opened from OUTSIDE the Played window must pin it (`cmbEnsure` does); the tutorial step `sh-combat` describes the panel, so update its text when the panel changes.
6. **Helper-off check (v2.6.131):** every line a bot depends on must also be writable with the combat helper OFF (Classic / tournament) — from the Combat menu, as log lines only. A new automatic line needs a helper-off menu twin shown only while `!hx('resCombat')` (the `cmbTaken` pattern). Test with `conv.tournament = true`.

B1 note: the splitter READS `/tmp/original.html` (copy the client there first: a stale copy splits an older client, v2.6.163) and writes to `/home/claude/elysium-src`; link it (`ln -sfn /home/claude/elysium-src elysium-src`) and build to `/tmp/rebuilt.html`, then `cmp` — never trust a `cmp` after a build that printed an error.

## Update the embedded Help pages (Menu → Help → Bots / Local server) — v2.6.127

The two pages live INSIDE the client as `<template id="helpDocBots">` / `<template id="helpDocServer">`, each around a marker pair `<!-- @@HELP:<key> -->` … `<!-- @@/HELP:<key> -->`. Never edit between the markers by hand.

1. **Bots page (the bot project's release):** put their re-issued `START-HERE-BOTS.html` beside the client and run `node embed-help.js bots START-HERE-BOTS.html`. Their text is embedded verbatim (ids prefixed `hb-`, their `<script>` dropped). Do NOT edit their prose here — ownership rule.
2. **Local server page (ours):** edit `help-local-server.html` (the authoring source, in the project), then `node embed-help.js server help-local-server.html`. Check every fact against `elysium-server.js` constants / CLI flags and the client's dialog names while you write — the page is the converged replacement for START-HERE + Host Guide and says nothing the code does not do.
3. **Design changes:** the stylesheet is `<style id="helpCss">` in `<head>`, every rule scoped under `.helpDoc` (or `#helpModal` / `body.helpDoc` / `html.helpPage`). Mirror the bot project's stylesheet changes by hand; re-state any client selector that would reach the page (`main`, `header`, `.modal h3`, `.modal .note` are already re-stated). A suite test refuses an unscoped rule.
4. **Verify:** `node embed-help.js --check bots START-HERE-BOTS.html` / `--check server help-local-server.html` (the drift test in `test-client-logic.js` does the same — the server file is REQUIRED beside the suite, the bots file optional), then the normal gates. B1 is unaffected (templates sit outside `<script>`), but the client grows by the pages' size — expect the byte count to move.
5. **Browser check:** Menu → Help → Bots / Local server; the sticky nav marks sections while scrolling the modal; a `#anchor` in a closed `<details>` opens it; `↗ New tab` opens the standalone page (Blob URL) and its links work; Esc / Close leave the address bar untouched.

Mint ids as `helpDoc*` and grep before adding any new id: `$()` returns the first match and a duplicate wires a listener to the wrong element silently (v2.6.128 -- the suite now refuses duplicate ids in the static markup). Never spell a bare `<script>` / `</script>` in the client's own script (even in a string) — `helpStandalone()` writes `'<scr'+'ipt>'` for exactly that reason.

## Add or move a Settings row — v2.6.86

The modal has six sections (Table, Play helpers + the host policy box, Files & storage, Sound, Shortcuts, Fixed controls); each of the first four ends with `<button class="btn set-advbtn">Advanced ▸</button>` immediately followed by `<div class="set-adv" hidden>` (setAdvToggle reads `nextElementSibling` — never put anything between them).

1. A row is `<label class="set-row"><span class="sl">…</span><input …></label>` (or a `div` with a select/buttons). The `.sl` text is ONE line ≤ 100 characters stating the effect; anything longer goes in a `title` on the `.sl` span. No version history, no 'Local only' (the modal's top note says it once). The suite fails on a description over 100 characters.
2. Common = something a player touches in their first sessions; everything else goes inside the section's `.set-adv` box.
3. Keep the control's id; the wiring (`addEventListener` by id, `openSettings()` sync) never moves. If you add a NEW control, add its id to the v2.6.86 suite's id list.
4. Host-only rows live in `#helperHostBox` (JS shows it for hosts); banner rows (`#helperBanner`, `#imgProgressRow`) keep their ids and JS-controlled display.
5. **v2.6.91 — the header's '(custom)' tag and Reset:** a new PREFERENCE that lives in `conv` must be added to `SETTINGS_CONV_KEYS` (and its live-apply line, if it has one, to `settingsApplyProfile`), or the header will not see it and Reset will not restore it. Helpers (`HELPER_DEFS`), shortcuts (`ACTIONS`) and sound channels (`SFX_CHANNELS`) are picked up automatically. Data controls (downloads, caches, storage rows) are NOT part of the profile — leave them out. The v2.6.91 suite pins the profile shape.

## Gate a feature by interface mode (Lite/Full) — v2.6.74

The mode is `conv.uiMode` ('full' | 'lite'); `uiMode()`/`uiLite()` read it (no overrides since v2.6.75). Presentation = `body.lite`, applied by `applyUiMode()` (and once inline right after loadConv, before the first paint).

1. **Hide the entry point with CSS, scoped to the class.** Full-only element: add its id to the `body.lite #… {display:none !important}` rule (or give it a class and extend the rule). Lite-only element: class `liteOnly` (hidden by `body:not(.lite) .liteOnly`). Inside `#mpModal`, use the halves: `.mpFull` (never in Lite), `.mpCreateOnly` / `.mpJoinOnly` (per `data-mp`), `.mpGs` (folded behind Game settings in Lite's Create). Pair a `.mpfield` with its `.mpdesc` — the grid is field | desc.
2. **Gate the function behind it with `uiLite()`** — `if(uiLite()){ toast('… is available in Full mode'); return; }` at the top of the opener (openDeckLab / openOffline are the pattern). Hidden buttons are not a gate: the menu, deep links and the tutorial reach functions directly.
3. **Menu rows:** in the `#btnMenu` handler, branch on `_lite`; a greyed row is `{label, disabled:true, title:'… available in Full mode'}` (`renderItems` sets `title`; `.mi.disabled` keeps pointer events so the tooltip shows).
4. **Hidden create fields need values.** Anything Lite hides in the Create dialog is still READ by `mpCreate()` — set it in `mpLiteDefaults()` (never leave a stale Full value behind a hidden field). Since v2.6.80 the dialog has two halves in BOTH modes (`data-mp`) and two folds (`.mpGs` Game settings, `.mpSrv` Local server, opened via `mpFold('gs'|'srv', true)`); a field that belongs to one half carries `.mpCreateOnly` / `.mpJoinOnly`, a Full-only one `.mpFull`, a folded one `.mpGs` / `.mpSrv`. A tutorial step that targets a folded field opens the fold in `onEnter`.
5. **The tutorial audit.** If the element is a tutorial target, nothing to do — opening the tutorial from Lite performs a real switch to Full (`uiSetMode('full',{force:true,quiet:true})` in `openTutorial`, v2.6.75) and the player stays there; the suite asserts the switch is in `openTutorial` and that no `uiLift(` remains. A Lite-only element is therefore never shown during a tutorial.
6. **Settings the mode should default differently:** add the key to the trio in `uiProfPick` + `UI_PRESET` + `uiProfileSwap` (currently anim / pco / sfxVol) — they are remembered per mode.
7. **Tests:** pure functions first (`uiFirstRunMode`, `uiProfileSwap`, `mpLiteAddr` are the shape); a source-level assertion for the CSS gate + the dialog classes (the suite walks them); `loadClient(CLIENT, {storage:{'elysium.convenience': JSON.stringify({…})}, location:{protocol, host}})` to boot as a returning / first-time visitor.

## Edit or add a TUTORIAL chapter

Checked against the v2.6.52 online resync. The tutorial is prose that ships, so it drifts like any
other doc — and until v2.6.52 nothing in the gate chain read it.

1. **`TUT_SECTIONS`** — the chapter object: `name` and `desc` (both shown in the picker), then
   `steps:[]`. A step is `{ id, target:()=>..., place, text, advance:{on:'manual'} }`; optional
   `scroll`, `clickThrough`, `freeInteract`, `allowSkip`, `skip`, `gate`, `onEnter`, `onExit`.
2. **`TUT_ORDER`** — append the key, or the chapter exists but is never listed. The picker numbers
   sections from this array.
3. **`TUT_ADVANCED`** — add the key for anything optional. Advanced chapters are always unlocked
   and `tutNextReady` skips them, so they are never offered as an automatic "continue?".
4. **`tutLaunch`** — check the prefix routing (`secId.indexOf('online')===0` etc.); a new key that
   matches no branch falls through to a bare `tutStart` with no view set up.
5. **Targets must exist.** `target:()=>$('#foo')` with a missing `#foo` does NOT skip unless the
   step carries `allowSkip` — it renders a bubble with no spotlight. Grep the id before trusting it.
6. **Fixtures** (`tutDemoLobby` and friends) feed the REAL renderer, which keeps layout honest but
   not perspective: check whose chair the fixture puts the reader in.
7. **Gate:** `node test-client-logic.js` now sweeps every `$('#id')` target across all chapters,
   validates the registry, and asserts both demo-lobby roles. Add a fixture, add its assertion.
8. Then the usual: `node --check` on the extracted script, B1 roundtrip byte-identical, bump
   `VERSION`, resync the PROTOCOL header (check-versions gates it even for text-only releases).

## Add a table-wide option the HOST chooses at creation

Checked against the v2.6.51 Helpers choice. The wire may already be done — look before building.

1. **Check whether the field already exists.** `grep` the option name in `elysium-server.js` and
   `ELYSIUM-PROTOCOL.md` first. `helperPolicy` was already accepted on `create` and already
   documented; the entire delivery was client-side, with no server bump and no restart.
2. **One mapping function, not scattered conditionals.** `helperPolicyFor(mode)` turns the named
   UI modes into the existing state shape. The mode STRINGS then live in exactly two places: that
   function and the `<select>`. Nothing downstream learns a new vocabulary.
3. **Read the choice at CREATE time, not at use time.** The dialog may be closed by the time a
   deferred handler runs — stash it (`net._createHelpers`) and clear it wherever the room is left,
   alongside the other per-room fields.
4. **Build the offline sibling in the same pass.** Hotseat has no policy channel, so name the
   third mode for what it actually is there ("Your local settings", not "Player's choice"), and
   apply it SESSION-ONLY — no `saveConv`, no `saveHelper`.
5. **If a control changes id or element type, grep the retired id.** The tutorial referenced
   `#offTournament` at four sites, two calling `.checked=false`, which fails silently on a
   `<select>`. `grep -n oldId client.html` after the edit, every time.
6. **Verify the old default before trusting the comment beside it.** See the learnings entry: the
   "default tournament for new rooms" fallback had been unreachable for the whole hosting track.

## Skill: Batch patching — every anchor matches the ORIGINAL file, never an earlier rep's output
The count-assert pattern (`assert s0.count(old)==1` per rep, apply all at the end) protects against partial writes — but it counts against s0, the untouched original. Twice this project has tripped on an insert whose anchor only exists AFTER another rep in the same batch runs (v2.6.8: a replacement text containing the bare line a later counter hunted; v2.6.13: an insert anchored on a rename's output). Rule: if edit B's anchor depends on edit A's output, merge A+B into ONE rep against original text. A batch is a set, not a sequence. Corollary: after any assert-abort, verify the file is UNWRITTEN (VERSION grep) before re-running — the write-after-loop guarantees it, but confirm rather than assume.

## Skill: Run every gate's FULL output at least once per session — and always before a release
`tail -3` on check-versions muted a broken version-lockstep and a stale protocol header for many consecutive turns; the full printout surfaced them instantly at the pre-release pass (and the lockstep break was a LIVE user-facing warning on every join, not bookkeeping). Truncate a gate's output only after consciously deciding which lines are safe to lose. Related reading discipline: verification printouts are EVIDENCE, not ceremony — an unexpected line in your own output (v2.6.5's 'unrelated.png -> CARD') is a free finding, but only if actually read.

## Skill: A new server verb is not DONE until a client send-site exists — trace button→payload→branch
The dispatch suite drives handle() directly, so it can prove a server feature that no client control can reach (the admin feature shipped fully server-tested and fully unreachable — zero send sites for `m.admin`). Delivery gate for every new verb: grep the CLIENT for the verb's send site, and walk the user journey (which control produces this message?) once. The server suite proves the server; only the journey proves the feature.

---

## Skill: Add a new `conv` setting (local convenience toggle)

A setting that lives in the player's browser and controls a client-side behaviour.

### Steps

1. **Default value** — add the field to the `let conv={...}` object (line ~1805). Pick a sensible default (bool, string, or number).

2. **Load from localStorage** — add a type-checked line in the `try{ const s=JSON.parse(...)` loader block (line ~1828). Follow the existing pattern:
   - Boolean: `if(typeof s.myField==='boolean') conv.myField=s.myField;`
   - String enum: `if(s.myField==='a'||s.myField==='b') conv.myField=s.myField;`
   - Number range: `if(typeof s.myField==='number' && s.myField>=0 && s.myField<=100) conv.myField=s.myField;`

3. **Migration** (if replacing an old field) — add a migration line in the same loader block. Example: `if(s.oldField && conv.newField==='default') conv.newField='migrated';`

4. **UI element** — add a `<label>` / `<select>` / `<input>` row in the Settings modal HTML (inside the appropriate `<div class="set-section">`). Use a unique `id` with the `conv` prefix for **all** Settings elements — both checkboxes and dropdowns: `convMyField`. Examples from the codebase: `convCardDB`, `convAutoLock`, `convPco`, `convAnim`, `convHoverPreview`.

5. **Sync on open** — in `openSettings()` (~line 10681), add `$('#convMyField').checked=conv.myField;` (or `.value=conv.myField` for selects).

6. **Change listener** — after the Settings block (near line ~11085), add:
   ```js
   // For a checkbox:
   $('#convMyField').addEventListener('change', e=>{
     conv.myField = e.target.checked;
     saveConv();
     // Optional: trigger a visual refresh (applyPco(), renderL3(), etc.)
   });
   // For a dropdown (<select>):
   $('#convMyField').addEventListener('change', e=>{
     conv.myField = e.target.value;
     saveConv();
   });
   ```

7. **Use the setting** — gate your feature on `conv.myField` at its call sites.

7b. **Register it for the Settings header + Reset (v2.6.91)** — add the key to `SETTINGS_CONV_KEYS`; if the change listener does more than `saveConv()` (a repaint, a reload of something), add that same call to `settingsApplyProfile` so Reset applies it live. Its default is read from `CONV_DEFAULTS` (the frozen literal) — no extra registration needed.

8. **Verify** — syntax check + `node test-client-logic.js` (16/16).

### If the setting should be host-lockable (room-wide)

Add these extra steps after step 6:

- **Server `create` handler** — in `elysium-server.js`, the `create` case (~line 888) already validates known fields from `m`. Add your field with strict validation (e.g. `myField: m.myField === 'a' ? 'a' : 'default'`).
- **Server room storage** — store it on the `room` object.
- **`joined` message** — include it in the `msg` object built inline in the join path (~line 218, where `msg.boardMode` / `msg.reactSecs` are assigned). There is no named `joined()` function — it's inline message-building.
- **`started` broadcast** — include it in the `bcast` at game start (~line 467).
- **`lobby` snapshot** — include it in `bcastLobby` / the lobby render data.
- **Client `joined` handler** — in the `MP_HANDLERS.joined` function (~line 6644), read it: `net.myField = m.myField || 'default';`
- **Client `create` verb** — add it to the `mpSend({t:'create', ...})` call (~line 6599).
- **Client `took` handler** — read it in `MP_HANDLERS.took` (~line 6705).
- **Named saves** — include it where the match is persisted/restored (`saveMatch` handler ~line 784; the saved-match data shape `loadMatch` reads ~line 1145).
- **Bump the server VERSION** — this is a wire protocol change.

---

## Skill: Add a new helper (phase-helper toggle)

A toggleable convenience that assists with turn structure, gated by tournament mode and host policy.

### Steps

1. **`HELPER_DEFS` entry** — add a row to the `HELPER_DEFS` array (~line 6007):
   ```js
   { key:'myHelper', el:'helperMyHelper' },
   // or { key:'myHelper', el:'helperMyHelper', def:false } for default-off
   ```
   This single entry auto-generates: the default value, the localStorage round-trip, the Settings checkbox sync, and the change-handler wiring.

2. **HTML label** — add a `<label id="helperMyHelper">` row in the Settings modal's helper section.

3. **Server `HELPER_KEYS`** — add `'myHelper'` to the `HELPER_KEYS` array in `elysium-server.js` (~line 144). This makes it host-lockable.

4. **Gate your feature** — use `hx('myHelper')` at the call site. This function handles: tournament mode (forces off), host lock (uses host settings), and local toggle.

5. **Disabled menu items** — if the helper gates a menu action, use `disabled: !someCondition` in the menu item object. `renderItems()` handles the CSS (`.mi.disabled`: opacity 0.4, `pointer-events:none`) and skips the click handler.

6. **Verify** — syntax check + client logic suite + server syntax check.

---

## Skill: Making a plain-property asset (not a function) respect a new resolution tier — the getter trick (v2.6.4)
When an asset is read as a plain property (`BACKS.crypt`, not `imgUrl(name)`) at many call sites, you can't add tier-checking logic without either touching every site or changing them all to a function call. A getter (`get crypt(){ return conditionalLogic ? tierA : tierB; }`) makes `obj.crypt` re-evaluate on every read, completely transparently — every existing call site keeps its exact syntax and silently gains the new logic. Use this whenever "convert reads to a function call" would otherwise mean a wide, mechanical touch across the codebase.

## Skill: A static CSS `url(...)` cannot be redirected by any JS-side tier logic
`background:url('https://...')` in a stylesheet is resolved by the CSS engine at parse/apply time — no getter, no JS variable, nothing at runtime can intercept it. If an image declared this way needs to respect a runtime choice (like a local-folder toggle), remove the CSS url() (keep the other properties: size, position, etc.) and set `.style.backgroundImage` in JS at the moment the element is actually about to be used — ideally at the same point/frequency the rest of the system resolves that asset, not once at page-load, so a later toggle change is still respected.

## Skill: Flattening a slash-bearing key into a flat filename, safely, without a lookup table
When several related asset kinds share one caching convention keyed by a slash-bearing sub-path (here: `'svg:' + 'path/caine'` etc., an existing IndexedDB-cache key format), and you want a FLAT local folder (no subdirectories) mirroring the same keys: replace `/` with a delimiter guaranteed absent from the actual segment values (checked against the closed, known set — here, no slug/trigram/clan-map value contains a hyphen), and reverse the same substitution in the fallback handler. This avoids maintaining a separate local-name ⇄ network-key table; the transform IS the table, as long as the delimiter choice is verified safe against every real value that set can take.

## Skill: Adding a new image-source tier without touching existing render call sites (v2.6.2 pattern)
When many call sites already each own DIFFERENT error/fallback handling for the same resource type (here: ~18 `<img src=imgUrl(...)>` sites with webp<->jpg retry, BACKS.* swap, hide-and-show-text, all different), do NOT refactor every site to learn about a new tier. Instead: (1) make the shared URL-builder return the NEW tier's URL first when its toggle is on, keeping the OLD body callable under its own name as the fallback target; (2) add ONE document-level CAPTURE-phase `error` listener that recognises a failure FROM THE NEW TIER specifically (by src shape), calls `stopPropagation()` (capture always fires before the target's own listeners get a turn — this is what lets the interception work), and rewrites `.src` to the fallback URL; (3) if THAT ALSO fails, the src no longer matches the new tier's shape, so the shared listener no longer intercepts, and the event proceeds to whichever per-element handler that call site already had, completely undisturbed. Net result: a new fallback tier prepended in front of an existing, heterogeneous chain, with zero changes to any existing call site.

## Skill: Add a new server verb (online action)

> **Room-FLAG variant (v2.5.64 `tournLock`):** a per-room boolean set at `create` needs SIX touch-points or it silently drops somewhere: (1) the create handler's room literal, (2) `snapshot()` + (3) `restore()` (the rooms.json round-trip), (4) `buildSave()` + (5) the `loadMatch` restore block (named saves), and (6) every relay the client reads it from (`joinReply`, the spectator-`joined` literal, the `started` broadcast). Gate placement matters: a lock that must protect stored state (the deck) goes BEFORE the handler overwrites it, not after. The v2.5.65 `ledger` array rode the same map minus the relay leg (pull-model via `ledgerGet` instead of a `joined` field), and its diff hook sits BEFORE `p.pub` is overwritten for the same reason.

A new client→server→client message for an online feature.

### Steps

1. **Choose the verb name** — short, lowercase, camelCase. Examples: `edgePass`, `edgeTake`, `shufPile`, `pileReturn`, `recall`/`recalled`/`ctrl` (v2.5.25–2.5.26 cross-board — pure routing: validate the seat, forward to the holder, echo back; the holder validates `owner === from` before acting).

2. **Server handler** — add a function to `GAME_HANDLERS` in `elysium-server.js` (~line 329):
   ```js
   myVerb(conn, room, p, m){
     // p = the sending player object (has p.name, p.game, p.out, etc.)
     // m = the parsed message from the client
     // NEVER trust client-sent seat numbers — derive from:
     const seat = room.players.indexOf(p) + 1;
     // Validate all input, sanitise strings with cleanCard() / String().slice()
     // Respond: wsSend(conn.sock, {...}) for the sender only
     // Broadcast: bcast(room, {...}) for everyone (optionally exclude sender)
   }
   ```

3. **Client send** — call `mpSend({t:'myVerb', ...data})` at the action site. Remember: `mpSend` is a no-op in hotseat (`net.ws` is null).

4. **Client handler** — add a handler to `MP_HANDLERS` (~line 6643):
   ```js
   myVerbResponse(m){
     // process the server's response/broadcast
   }
   ```
   The dispatch is automatic — `mpOnMsg` looks up `MP_HANDLERS[m.t]`.

5. **Hotseat equivalent** — if the feature should work offline, write a local function (e.g. `myVerbHot(...)`) that applies the same mutation directly to `net.hot.boards[seat]` and/or `net.boards[seat].pub`. Gate the dispatch:
   ```js
   if(net.hot && !inRoom()) myVerbHot(...);
   else mpSend({t:'myVerb', ...});
   ```

6. **Error handling** — server errors: `return wsSend(conn.sock, {t:'err', msg:'...'});`. Client: errors propagate to `ws.onmessage`'s try/catch → `dbg('mpOnMsg')`.

7. **Sanitisation** — never relay raw HTML or user text. Card names: `cleanCard()`. Strings: `String(x).slice(0, limit)`. Numbers: `Math.max/min` clamping.

8. **Update protocol docs** — add the verb to the "Protocol reference" tables in the Technical Documentation.

9. **Bump the server VERSION** if this is a new protocol verb.

10. **Test** — server syntax check. If networking is available, add a test in the appropriate `test-2*.js` suite. If not, say so explicitly.

---

## Skill: Add a new token type

A non-card object on the board (like the Edge).

### Steps

1. **`TOKEN_DEFS` entry** — add to the registry (~line 5271):
   ```js
   myToken: {
     label: 'My Token',
     size: 80,          // pixel size at scale 1
     svg(sz){           // returns an SVG string
       return '<svg viewBox="0 0 100 100" width="'+sz+'" height="'+sz+'">...</svg>';
     },
     menu(tok){          // right-click menu items (or null)
       return [{ label:'Do thing', fn:()=>doThing(tok) }];
     }
   }
   ```

2. **Create/remove** — use the generic engine: `makeToken('myToken')`, `removeToken('myToken')`. `makeToken` handles DOM creation, `bindTokenDrag`, and `board.appendChild`.

3. **Placement** — `placeToken(tok)` handles `pubXform` + `cardTransform` + L4 scaling automatically. Set `tok.x`, `tok.y` (canonical coordinates), then call `placeToken(tok)`.

4. **Serialization** — `buildPub()` already exports `tokens: [...]` from the `tokens` Map. `buildMat()` already renders them from `pub.tokens`. No changes needed for the generic case.

5. **Online verbs** — if the token can be passed between players (like the Edge), add verb(s) following the "Add a new server verb" skill.

6. **Hotseat** — if the token transfers between seats, write into all three state layers (see CLAUDE.md "Hotseat state layers").

### Critical rule

**Never put tokens into `state.cards` or `state.zones`.** Tokens use a parallel `tokens` Map with their own placement/drag pipeline. Mixing them breaks clone animations, drag behaviour, and zone snapping.

---

## Skill: Add a sound effect (SFX)

Web-Audio synth sounds (no audio files — keeps the zero-dependency, single-file promise). All SFX live in the `sfx-audio` fragment and are gated on `conv.sfxVol`.

### Steps

1. **Write the sound** — add a function in the `sfx-audio` section that builds oscillators/gains off the shared `actx` AudioContext. Bail out immediately when muted:
   ```js
   function sfxMyCue(){
     if((conv.sfxVol==null?0:conv.sfxVol)===0) return;   // master mute → no AudioContext work at all
     actx = actx || new (window.AudioContext||window.webkitAudioContext)();
     if(actx.state==='suspended') actx.resume();
     const t = actx.currentTime;
     // build osc + gain, schedule the envelope relative to t, scale peak gain by conv.sfxVol/100
   }
   ```

2. **Scale by master volume** — multiply your peak gain by `(conv.sfxVol/100)` so the Settings slider (0–200%) works. If the cue is one of the per-event sounds, respect its level in `conv.sfxIndiv`.

3. **Fire it** — call `sfxMyCue()` at the game event (played card, lock/unlock, pass bell, oust, your-turn). Cooldown-guard high-frequency events so sounds don't stack (see the logged-event cue's cooldown pattern).

4. **Tune in isolation first** — `vtes-sfx-demo.html` is a standalone Web-Audio playground with no game state; prototype the timbre there before wiring it in.

5. **Verify** — syntax check + client logic suite. (Sound itself is unverifiable in the sandbox — say so; Johan listens live.)

---

## Skill: Add a keyboard shortcut / action

A bindable action that appears in Settings → Shortcuts.

### Steps

1. **`ACTIONS` entry** — add to the array (~line 10449):
   ```js
   {id:'myAction', grp:'adv', def:'', label:'My action description', fn:myFunction},
   ```
   - `grp`: `'basic'` (always shown) or `'adv'` (behind "Show advanced")
   - `def`: default keybind (single key, e.g. `'M'`, `'F6'`) or `''` for unbound
   - `fn`: the function to call (must exist at this point in the script)

2. **The function** — write it anywhere before the `ACTIONS` declaration. It receives no arguments (the keymap calls it bare).

3. **Automatic wiring** — the keybind system, Settings UI rows, and the keydown dispatcher all read `ACTIONS` — no manual wiring needed.

---

## Skill: Add a touch gesture / touch-aware input (v2.5.39+)

Two gates, never mixed: **behaviour** branches per event on `e.pointerType==='touch'` (hybrid laptops stay correct with no mode switch); **presentation** (bigger targets, extra rows) gates on `body.touchui` / `touchUI()` (backed by `conv.touchUI`, default `'auto'`).

1. **Gesture start hygiene** — copy the standard prologue into any new `pointerdown` gesture: `if(e.button!==0) return; if(!e.isPrimary||drag||tdrag||pileDrag||mq||giveDrag) return;` (one gesture at a time; a stray second finger must never hijack). Movement threshold: `(e.pointerType==='touch'?10:5)` px — 10 keeps long-press (10 px slop) reachable under finger jitter.
2. **Window/document-level listeners** must be pid-scoped: stamp `pid=e.pointerId` at start, filter every move/up on it, and mirror the `pointerup` cleanup on `pointercancel` (real cancels happen on touch; the long-press engine also relies on that mirror to tear the gesture down).
3. **Context menus on touch come from the long-press engine** (before the deep-link block): it dispatches a *genuine* `contextmenu` at the touch point — so a normal `addEventListener('contextmenu', …)` on the new element is ALL you need; never build a separate touch menu path. If the element runs its own capture-based drag, give it a cleanup reachable by teardown (a `pointercancel`/`lostpointercapture` listener, or a module-global the engine's direct-null list can cover — remember a synthetic `pointercancel` does NOT fire `lostpointercapture`).
4. **CSS**: interactive elements inside `#board` are already covered by its `touch-action:none`; add per-element `none` only if the element can render *outside* the board (the `.card`-in-`#rview` case). Scrollable children get `touch-action:pan-y` (declared intent; evaluation stops at the nearest scroll container anyway). Coarse-only sizing goes in the ONE `@media(pointer:coarse)` block near `</style>`; prefer in-place `transform:scale()` over width/height changes on absolutely-positioned controls (scaling grows the hit box without disturbing offset math).
5. **Press-and-hold controls** use `bindHold(el, fn)` (v2.5.40): one step on down, repeat after 400 ms @90 ms, pointer-captured, overlay-guarded per tick (the wrapped action may `await` a modal). Replace-not-wrap: remove any `click` handler the button had, or every press double-fires — and restore keyboard activation with a `detail===0` click listener inside the helper (v2.5.43: Enter/Space fires a detail-0 click, never pointerdown). Add the control's selector to the long-press engine skip-list (holding it must never open a menu).
6. **Menu-embedded controls** use `renderItems`' `{el}` item type — the element is appended with NO leaf bindings (no auto-close, no `pushUndo`); the control manages its own undo/log (the stepper leans on `bumpCounter`/`bumpPool`'s burst coalescing). Sub-region taps on an already-bound element (a badge on a card) carry a discriminator on the gesture object (`drag.badgeKind`) and resolve in `tap()` — never a new capture-phase interceptor.
7. **Multi-pointer gestures** (v2.5.41): track pointers in a capture-phase document Map; on activation tear singles down by tier — direct-null module globals (with their cancel-cleanup bodies), dispatch ONE real `pointercancel` for unconditional document cleanups, and dispatch it **with the right `pointerId`** for pid-scoped mirrors — then OWN your pointers: `stopPropagation` their move/up/cancel in capture so nothing else (closure-local drags, hover trackers) ever sees them. Add `.l3panning` for rigid transforms. Gesture handoffs between two same-element handlers can ride a module global + registration order — comment the order-dependency at BOTH sites.
8. **Tap actions that native listeners might duplicate** get a yield window (`_tapDrawAt` pattern): the touch path stamps a timestamp, the native click/dblclick listeners return inside 500 ms — engine-agnostic, no synthesized-click guessing. Touch **double-taps** go through `bindDbl(el,fn)` (v2.5.42): keeps the native dblclick for mouse, adds a 380 ms pointerup pair for touch, never arms on holds >350 ms, and one-shot-suppresses Android's synthesized dblclick duplicate.
9. **Verify**: the three gates as usual; gesture feel itself is live-only (Johan, tablet + touchpad) — note it explicitly in "Att testa live".

## Skill: Feature with dual transport (hotseat + online)

The canonical pattern for any table feature that works both locally and over the network.

### Design principle

Write the feature once against the shared board model. Branch **only** at the commit point:

```js
function myFeature(targetSeat, data) {
  // Shared: validation, UI update, logging

  if (net.hot && !inRoom()) {
    // HOTSEAT: apply locally to stored boards
    myFeatureHot(targetSeat, data);
  } else {
    // ONLINE: send to server, let the echo apply it
    mpSend({t:'myFeature', seat:targetSeat, ...data});
  }
}
```

### Table-scoped override of a persisted setting (v2.6.92)

Never write a `conv` key straight for 'the table's duration': `conv` is saved whole, so the next `saveConv()` persists the override. Use the pair -- `hotTournSession(val)` (snapshot once into `hotTournBefore`, then set) on entry, `hotTournRestore()` in `leaveHotseat` -- and mirror a deliberate Settings edit of that key into the snapshot while an override is in force (see the `#convTournament` handler). For a NEW table-scoped key, copy the pair with its own `*Before` variable, or prefer a session FLAG that `hx()`-style readers consult (the `helperAllOn` pattern) so the persisted object is never touched. The suite counts the bare `conv.tournament` writes (5).

### Referee verbs on a bot seat (v2.6.97)

A bot owns its own pool, board and out state and republishes them, so a client-side edit to the stored pub evaporates on its next push. Any seat-level referee verb aimed at a bot must travel to the bot: `hotBotSeat(seat)` (roster bot AND connected on the bridge AND `localTable`) then `hotBridge.toBot(seat, {...})`. The bot already has `forceSetPool` and `forceOust`. If a new verb's value triggers a transition inside the bot (pool 0 -> self-oust), invoke the transition's own path instead, so the table's bookkeeping stays with one owner. Card-level verbs follow the SAME rule since v2.6.126: `hotCtrl` opens with `if(hotBotSeat(seat))` and sends `{t:'ctrl', cid, act, from}` (srv 927's shape) over the bridge, then returns — the bot's push is the truth; `ctrlOptimistic` gives instant feedback. The client is the author of the stored blob ONLY for human seats (the old `hotCtrl` body, owner-checked). A bot-only verb (`burn`) is sent from a bot-seat-only menu row through the shared `_do`, so one row works online (`ctrlOnline`) and offline (`hotCtrl`). To add a bot-card verb: (1) confirm the bot's `ctrl` handler accepts it and note the bot version, (2) add the row under `(_mine||_botSeat) && (_hs||_on)`, gated `_botSeat` if bot-only, (3) teach `ctrlApply`/`ctrlOptimistic` the optimistic shape, (4) mention it in ELYSIUM-PROTOCOL.md's two `ctrl` rows, (5) a `parityTable` test asserting the wire shape + a `testB` LIVE test against the real bot.

### Online bots (v2.6.99, cap fixed in v2.6.102)

A bot online is just another WebSocket client: `netBotDial()` opens a second socket to `net.addr` (honouring `net.sec`), the bot joins `net.room` with `net.pass`, and the host's client holds that socket — so seating it is `bot.send({t:'seat',seat:N})`, the same verb a human uses, and removing it means closing the socket as well as `kick`. None of the hotseat bridge is involved. The table ceiling is `MP_MAX_PLAYERS` (6), a lockstep mirror of the server's `MAX_PLAYERS` — NOT the lobby snapshot's `seats`, which is `room.players.length` and only the seat-picker's range. Gate additions on `netBotWhy()`; anything that cannot change after room creation (board mode) must be a gate, anything that can (helper policy) should be applied dynamically. Bots live in the host's tab: tear them down wherever the room ends.

### The hotseat bus (v2.6.95, board added in v2.6.98)

Online the server broadcasts every public line to every other player; offline `hotFanOut(msg, fromSeat)` is that bus. The human's own public lines ride `mpRelay` (so `log(msg, localOnly=true)` — which is how bot-injected lines are rendered — can never bounce back out); a bot's log/say/chat/fx fans out to the OTHER bot seats from `_fromBot`, always excluding the sender. If you add a new message shape that a bot both sends and reads, fan it out there too, or it will work online and do nothing at a hotseat. Board pubs ride it too (v2.6.98): each bot's pub fans out to the other bots, and the active human's board goes to every bot seat from `schedulePush`/`pushNow` on the same 600 ms debounce, seeded at `startHotseat`. ONE deliberate exception: a bot's `say` index 0 ("Hold on…") is not relayed to other bots — see the learnings entry. Offline chat rides the same bus and is the channel the bots' opening line advertises.

**v2.6.159 — what the bridge relays, and the lift contract.** The bridge mirrors the server for every verb a released bot sends or reads (PROTOCOL §12.2 is the table: `edgeTake` both ways, `edgePass` to a bot, `revealHand` / `logTo` both ways, the human's open hand to the bots). A new relay goes into `_fromBot` (the bot's side) AND into the human's sender behind `!inRoom()` (the human's side), each pinned by a test that fails on the previous client. **The bot project lifts `const hotBridge = {…}` + `function hotFanOut` verbatim** into a context holding only `VERSION`, `net`, `log`, `localTable`, `MP_HANDLERS`: call any other client function inside the literal only as `try { if (typeof X === 'function') X(...); } catch (e) {}`, and read a client `const` only under `typeof X !== 'undefined'`. The test 'the bridge stays liftable' fails otherwise (it uses their cut markers and context, scans the cut for the client's top-level names and runs every `_fromBot` case there) — extend its message list when you add a case.

### Hotseat commit pattern

```js
function myFeatureHot(seat, data) {
  if (seat === mySeat()) {
    // Active seat: mutate state directly
    state.myThing = data;
  } else {
    // Stored seat: parse JSON → mutate → stringify
    const b = JSON.parse(net.hot.boards[seat]);
    b.myThing = data;
    net.hot.boards[seat] = JSON.stringify(b);
  }
  // Also update the pub view (for overview rendering)
  if (net.boards[seat]) {
    net.boards[seat].pub.myThing = data;
  }
  // Refresh the current view
  if (typeof net.view === 'number') renderRemote(net.view);
  else if (net.view === 'ov') renderL3();
}
```

### Common mistakes

- Forgetting the third state layer (active seat is live `state`, not `net.hot.boards[mySeat()]`).
- Treating `net.hot.boards[seat]` as an object (it's a JSON **string**).
- Only updating pub but not the stored board (changes vanish on seat switch).
- Adding a new persistent field without putting it in **both** `serializeGame`/`restoreGame` (hand-off + save) **and** `snapshot`/`restoreSnap` (undo) — it is then silently wiped on the next seat swap or undo. (v2.5.3: `state.target`, the play-FX aim, was lost on every hotseat hand-off this way; v2.5.10: `net.rtarget`, the *cross-board* target, had the identical bug — and a leaked stale target even mis-routed the next hand-play through `qrGiveToTarget` into a self-give.) Restore it guarded by `state.cards.has(id)` if it points at a *local* card; `net.rtarget` points at another seat's board, so it is NOT validated against `state.cards` (the existing snapshot/roster pruning nulls it if stale). Then repaint (`updateSelVisual()` / `updateTargetBtn()`).
- Testing only in hotseat and not exercising the online path (bugs rot silently — see learnings).
- **Using a locally-minted incrementing counter as a sort key that has to merge across seats.** Fine in hotseat (one counter, shared via serialize/restore) but WRONG online — each client's counter starts at 0 independently, so the seats interleave by incomparable numbers. Use `Date.now()` (globally comparable, no coordination) + a stable id tiebreaker instead. (v2.5.19: `_avSeq`, the Played-tab play-order key, started as `++_avSeq` per client and interleaved wrongly online until it became a timestamp.)

---

## Skill: Add Played-tab info (ordering, sort modes, batch highlight)

The Played-cards tab/overlay (`#playedTab` / `#playedOverlay` / `#playedRow`) is a window-fixed, local, glanceable view of every loose card played since the last clear / phase change. It is **view-independent by design**: `position:fixed` (window-anchored, not board-anchored) and `renderPlayed()` has **zero L2/L3/L4 branches** — one code path. So new behaviour added here lights up in every view by construction; you do NOT add per-view handling.

### Key functions

- `collectPlayed()` — gathers own loose-ready cards (`state.zones.ready`) + every opponent's `pub.cards`, each tagged with owner colour + name. Sorts by `c._avSeq` ascending (play order). Reads opponent data from `net.boards[seat].pub` — populated by `buildPub()` in hotseat AND by the online `board(m)` handler (which stores `m.pub` verbatim), so the same code covers both transports.
- `renderPlayed()` — reads `conv.playedSort`: `'new'` calls `list.reverse()` (newest at top); `'action'` sorts by `avRank` desc (`isAction`=2, `actSt==='played'`=1, else 0) with `_avSeq` desc as tiebreaker, and tags `avc-batch` on `actSt==='played'` cards.
- `renderAltIfOpen()` → `renderPlayed()` — the universal refresh entry point; call it after any state change that should re-render the overlay.

### Ordering field (`_avSeq`)

Cards carry `c._avSeq = Date.now()`, stamped in `tagPlayed()`. **A timestamp, not a counter** — it must be comparable across independent online clients (a per-client counter only works in hotseat). It rides through **all four card-reconstruction paths**: `snapshot`/`restoreSnap` (undo), `serializeGame`/`restoreGame` (autosave + hotseat hand-off), `buildPub` (opponent pub), and `restoreFromPub` (online host snapshot-restore). Card id is the same-millisecond tiebreaker. **When adding any sortable per-card field, wire all four paths** or it silently sorts as 0 somewhere.

### Batch highlight (`avc-batch`)

A CSS `box-shadow` ring (NOT `outline` — that's used by `avsel` for selection; `box-shadow` composes with it). Applied to cards whose `actSt==='played'` (the current unresolved action + its modifiers) only in `'action'` sort mode. It clears when `resolvePlayedActions()` fires (which ends with `renderAltIfOpen()`). `actSt` is in `buildPub`, so the ring shows for opponents online and in hotseat.

### Resolve triggers (what closes the batch)

`resolvePlayedActions()` is called from: `tagPlayed()` when a new action-TYPE card is played (DB on); `activatePhase()` (phase advance, all batches); the basic minion `act()` lambda for Bleed/Hunt/Rescue/Diablerie/Card action (via a `resolve=true` default param — **Block passes `false`**, it's a reaction); and `saySend()` on the "It resolves" quick phrase (string-checked, not index). To add a new resolve trigger, call `resolvePlayedActions()` at the action's commit point.

---

## Skill: Add a Classic-tutorial step

Steps live in `TUT_SECTIONS` (an `app-*` fragment), keyed by section (`introduction`, `classic-crypt`, `classic-play`, …) ordered by `TUT_ORDER`. Each step is an object in that section's `steps` array.

### Step object fields
- `id` — unique kebab id (e.g. `cp-undo`).
- `target:()=>Element|null` — the element to spotlight; `()=>null` + `place:'center'` centres the box.
- `place` — `'top'|'bottom'|'left'|'right'|'center'` (box position relative to target).
- `freeInteract:true` — coach-mark mode (board stays interactive); most gameplay steps use this.
- `onEnter:function(){…}` — record a baseline here (e.g. `tut._fooBase = <counter>`); runs when the step activates.
- `text` — HTML; use `&mdash;`/`&rarr;`/`&rsquo;` entities and `<b>` for emphasis.
- `gate:function(){ return <bool> }` — completion predicate, polled each frame; Continue arms when it returns true.
- `gateHint` — the nudge shown until the gate passes.
- `advance:{on:'manual'}` — the standard pattern (gate arms Continue, the user clicks it).
- `skip:()=>bool` — omit the step when true (branching, e.g. vampire vs methuselah via `tut._playWithVamp`). Steps with **no** `skip` are where branches converge — put shared lessons there.

### Robust completion gates (important)
Gate on a **monotonic signal that only the target action moves**, not a visible side-effect several actions share. For "press Undo", gating on `hand.length >= base` is wrong — a *draw* also grows the hand. `undoStack` only *shrinks* on an Undo (every other undoable action grows it), so `undoStack.length < tut._base` (baseline set in `onEnter`, after the card is played) detects exactly an Undo. (v2.5.27: `cp-undo-play` + `cp-undo`.)

### Where to insert
Add the new object(s) before/after the anchor step in the target section, then run the client gate (syntax + `test-client-logic.js` + byte-roundtrip). No version is hardcoded in the tests.

## Skill: Park (retire) code

Move removed code to `kodarkivering.md` for potential future use.

### Steps

1. **Archive** — copy the removed code verbatim into `kodarkivering.md` with:
   - **What it did** — a short description
   - **Why it was parked** — the reasoning
   - **Where it lived** — file + approximate location
   - The **verbatim source** in a fenced code block

2. **Breadcrumb** — at each removal site in the live code, leave a comment:
   ```js
   // PARKED: description -> kodarkivering.md
   ```

3. **Assert safety** — breadcrumb text must **not** contain the exact identifier strings being asserted absent in any Python patch scripts. This causes self-inflicted assert failures.

4. **Clean up** — remove all references to the parked code: defaults, loaders, Settings UI, event listeners, CSS rules. Grep for the function/variable name to catch stragglers.

> **When "dead" code is interleaved with live code** (it happens — utility helpers get parked next to the feature that first used them, and a function can be a no-op *in effect* yet still be a live call target): do NOT force a wholesale delete. Grep each symbol's *call sites* first. Keep live callees in place (e.g. the hand-card type-sort helpers nested inside a retired dock's region); reduce a load-bearing-but-dead function to a **documented no-op stub** rather than deleting it (deleting throws at its live call sites); and leave already-`typeof`-/`if(el)`-guarded references — those guards were written precisely so the thing could be removed. (v2.5.11: archiving the legacy hand dock kept `handSortCmp`/`updateDockScale()` live and stubbed `renderHand()`.) Apply the removals as one atomic Python patch (`assert s.count(old)==1` per edit), then sanity-grep that dead defs are gone (count 0) and live helpers/callers remain, before the syntax / test / byte-roundtrip gates.

---

## Skill: Patch the client (atomic edit)

The safe way to edit the monolith.

### Steps

1. **Find unique anchors** — `grep -n 'your search' elysium-vtes-bord.html`. Verify the anchor appears exactly once.

2. **Write the Python heredoc**:
   ```bash
   python3 << 'PYEOF'
   with open('elysium-vtes-bord.html') as f: s = f.read()

   # Assert ALL anchors first (nothing written if any fails)
   assert s.count('ANCHOR_1') == 1, 'ANCHOR_1 not unique'
   assert s.count('ANCHOR_2') == 1, 'ANCHOR_2 not unique'

   # Apply ALL replacements
   s = s.replace('ANCHOR_1', 'REPLACEMENT_1')
   s = s.replace('ANCHOR_2', 'REPLACEMENT_2')

   with open('elysium-vtes-bord.html', 'w') as f: f.write(s)
   print('Patched OK')
   PYEOF
   ```

3. **Verify**:
   ```bash
   sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -
   node test-client-logic.js
   ```

4. **Deliver**:
   ```bash
   cp elysium-vtes-bord.html /mnt/user-data/outputs/
   # then call present_files
   ```

### Rules

- **Plain ASCII anchors only.** No smart quotes, em-dashes, or arrows in find-strings.
- **Single `\u` in `'PYEOF'` heredocs** produces the character. Double `\\u` produces literal text.
- **Chain from the latest output.** Never patch from the original project source — intermediate changes are lost.
- **Re-grep between edits.** Line numbers shift after every replacement.

---

## Skill: Re-sync the fragment build (split → build → cmp)

After editing the monolith, re-derive the `elysium-src/` fragments and prove they still reconstruct the file byte-for-byte. The monolith stays the source of truth — this keeps the B1 fragment mirror honest.

### Steps

1. **Snapshot the pristine monolith** — the splitter reads from `/tmp/original.html`:
   ```bash
   cp elysium-vtes-bord.html /tmp/original.html
   ```

2. **Split** — carve the `<script>` body into ordered fragments under `elysium-src/`:
   ```bash
   python3 split_client.py
   ```
   It asserts every anchor is unique and in source order, and verifies reassembly internally. If an anchor moved (you edited near a `*_START` / `*_END` boundary), fix the anchor in `split_client.py` first.

3. **Build** — reassemble `shell.html` + `manifest.txt` + fragments back into the monolith:
   ```bash
   node elysium-build.js                       # writes elysium-vtes-bord.html
   # or: node elysium-build.js /tmp/rebuilt.html   to compare without overwriting
   ```

4. **Prove byte-identity** — the gate that matters:
   ```bash
   cmp /tmp/original.html elysium-vtes-bord.html && echo "byte-identical"
   ```

5. **Re-check syntax on the rebuilt file** (the build shouldn't change it, but verify):
   ```bash
   sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -
   ```

### Rules

- **The monolith is upstream, not the fragments.** Edit `elysium-vtes-bord.html`; let the split re-derive the pieces. Don't hand-edit a fragment and rebuild — drift creeps in and `cmp` is the only thing that catches it.
- **"(N bytes)" in the build log counts characters, not bytes.** Trust `cmp` / `wc -c` for byte-identity, not the printed count.
- **Em-dash anchors must match exactly.** Some splitter anchors carry `—`; a typed hyphen fails the assert. Copy them verbatim.
- **If you move a fragment boundary**, update the matching anchor in `split_client.py` in the same pass. **v2.5.0 re-anchoring (done):** `buildPub()` had drifted below the hotseat block, breaking the source-order assert — and it broke on the *pristine* monolith too, so always test a failing build gate on unedited source first to separate a real regression from pre-existing drift. `net` now ends at `HS_START`; the post-hotseat chunk (incl. `buildPub`) is one app fragment; `buildPub` is no longer a cut anchor. The splitter now produces **12 fragments** (was 13).

---

## Skill: Regenerate the Word documentation

> **Note:** the generators (`build-docs-en.js` / `build-docs.js`) may be local-only — they aren't always in the project snapshot. If they're missing, ask Johan rather than hand-editing the `.docx` (the content lives in the generator; the `.docx` is build output). Read the `docx` skill first regardless.

### Steps

1. **Read the docx skill** — `view /mnt/skills/public/docx/SKILL.md` (mandatory before any doc work).

2. **Edit the generator** — modify `build-docs-en.js` (English) or `build-docs.js` (Swedish). The content lives in the generator, not in the .docx files.

3. **Build**:
   ```bash
   node build-docs-en.js
   ```

4. **Validate**:
   ```bash
   python3 /mnt/skills/public/docx/scripts/office/validate.py "Elysium - Player Manual.docx"
   python3 /mnt/skills/public/docx/scripts/office/validate.py "Elysium - Host Guide.docx"
   python3 /mnt/skills/public/docx/scripts/office/validate.py "Elysium - Technical Documentation & Roadmap.docx"
   ```

5. **Content check**:
   ```bash
   extract-text "Elysium - Player Manual.docx"
   ```
   Confirm content rendered and no `\u` / `\U` escapes leaked through.

6. **Deliver** — `cp` all three .docx files to outputs + `present_files`.

---

## Skill: Add a card menu action

A new right-click option on a card.

### Steps

1. **Find the menu builder** — card context menus are built in `cardMenu(c, x, y)` or the relevant zone handler. Items are objects:
   ```js
   { label: 'My action', fn: () => { pushUndo(); doSomething(c); } }
   ```

2. **Disabled state** — use `disabled: !condition` to grey out without removing:
   ```js
   { label: 'Phase-gated action', fn: () => {...}, disabled: !_phaseOK }
   ```

3. **Submenus** — use `sub: [...]` for a submenu. Ellipsis (`…`) in the parent label signals "opens submenu". Leaf items never have ellipsis.

4. **Undo** — always `pushUndo()` before the first mutation. For bulk operations, call it once before the loop (one undo step for the whole batch).

5. **Logging** — use `cardRef(c)` for card names in log entries. This function respects the anonymity rule: a card's name only appears in the log when the card is publicly visible.

6. **Special submenu** — crypt-specific or library-specific actions go under the "Special…" submenu at the bottom of the card menu.

---

## Skill: Add a room-wide setting (lobby / create dialog)

A setting chosen by the host that applies to all players.

### Pattern (follow an existing setting like `reactSecs` or `boardMode`)

1. **Client create dialog** — add a UI element in the create/lobby modal HTML. Read its value in the `mpSend({t:'create', ...})` call (~line 6599).

2. **Server `create`** — validate strictly in the create handler (~line 888). Example: `myField: m.myField === 'a' ? 'a' : 'default'`. Store on `room.myField`.

3. **Server `joined`** — include in the `msg` built inline in the join path (~line 218, alongside `msg.boardMode` / `msg.reactSecs`). It's inline, not a named function.

4. **Server `started`** — include in the `bcast` at game start (~line 467).

5. **Server lobby snapshot** — include in the lobby data.

6. **Server save/load** — include the field where the match is persisted: the `saveMatch` handler is at ~line 784, and the saved-match data shape that `loadMatch` restores is at ~line 1145.

7. **Client handlers** — read in `MP_HANDLERS.joined` (~line 6644) and `MP_HANDLERS.took` (~line 6705): `net.myField = m.myField || 'default';`

8. **Client lobby render** — display the setting in the lobby UI if players should see it.

9. **Bump server VERSION** — this changes the wire protocol.

### Checked against `tableSetup` (v2.6.146 / srv-2.6.44) — what the nine steps leave out

- **`joined` is built in two places and `took` is sent from two.** Players get `joined` from `joinReply`, spectators from their own inline message; `took` comes from promote and from loadMatch. Give the field to all four and assert EACH message in `test-server-dispatch.js` — a count of matches in the source is not a check.
- **The lobby message carries seats, players and watchers — no room options.** A client guard reads `net.<field>` (set by `joined`), never `net.lobbyData.<field>`. Step 5 above is wrong for every option so far.
- **The room snapshot needs the field; a saved match does not.** `roomSnap` / `roomUnsnap` (the rooms file that survives a restart) carry every room option — add the field to both and re-validate on the way in (an option tied to a board style is dropped when the record's board style does not match). `saveMatch` stores no room options at all (no `boardMode` either): a loaded match takes the options of the lobby it is loaded into, so step 6 above applies to per-match state only.
- **`took` keeps the room's value when its message has none** (`if(m.x!==undefined) net.x=…`). An older server's loadMatch sends less, and a default there overwrites what `joined` said.
- **The offline sibling:** `startHotseat(players, boardMode, opts)` and the bridge's `joined` (`hotBridge._…`, set in `hotSpawnBots`).
- **An option that belongs to one board style:** one `…Sync()` function greys and disables the box, called from every place that sets the select — including code that assigns `.value` and so fires no `change` (`syncOffBotLock`).
- **The host on an older server:** read the box once at create (`net._createX`), compare with what `joined` echoes, toast, and write the log line AFTER the deal line — `dealt` clears the log.
- **The dialog's grid:** a `.mpcheck` row spans both columns. With a description beside it, give the row `grid-column:auto` and look at the dialog in Full and in Lite.
- **Protocol:** the field goes into the `create` row (§3) and the `joined` / `took` / `started` rows (§8); `test-protocol-doc.js` holds them against the handlers' `m.<field>` reads.
- **If the server only has to remember the choice, let the client act on it with verbs that exist.** `tableSetup` deals nothing server-side; the client sends four `drawCrypt`. An old peer then needs nothing, and both mixed pairs just work.

---

- **v2.6.157 / srv-2.6.46 (`tableLayout`) took the same eight server touch points as `tableSetup`** (create, joinReply, the spectator's joined, started, both took, roomSnap, roomUnsnap) plus the protocol doc's three s2c rows — `test-protocol-doc.js` fails until `joined`/`took`/`started` list it. On the client, a value that drives GEOMETRY (card size, seat spots) is applied the moment it arrives (joined, started, took, startHotseat), not at view entry: the hotseat deals before L4 opens.

## Skill: Add a tutorial step or section

The guided tutorial (offline onboarding) is a self-contained `tut*` block in `app-5.js`. Steps are data, so most additions are a single object in a section's `steps[]`. Architecture: `CLAUDE.md` → "Tutorial" and `elysium-project-context.md` → "v2.5.2".

### Add a step to an existing section
1. Find the section in `TUT_SECTIONS` (`introduction`, `decklab`, `lobby`, `classic-intro`, `classic-crypt`, `classic-play`, `classic-interact`, `structured-intro`, `online-hosting` — all nine are full sections with their own `steps[]`, none are stubs). Add a step to its `steps:[]`:
   ```js
   { id:'lob-foo', target:()=>$('#someEl'), place:'top', scroll:()=>$('#someEl'),
     text:'What this control does.', advance:{on:'manual'} }
   ```
2. Choose the mechanic:
   - **Read + Continue** → `advance:{on:'manual'}`.
   - **Click the highlight to advance** → `advance:{on:'click'}` (the real handler still fires; a capture-phase listener advances).
   - **Let the real control work, advance on Continue** → add `clickThrough:true` (hole left open; a native `<select>` works regardless).
   - **Grey Continue until a condition holds** → `gate:()=>bool` + `gateHint:'…'` (polled every frame in `tutTick`).
   - **Grey Continue until the user clicks a real control** → `clickArm:()=>el` + `gate:()=>tut._click`.
   - **Bring a tall-modal element into view** → `scroll:()=>el`.
   - **A step on the L4 free board (cards placed anywhere)** -> `freeInteract:true` (coach-mark: no dim/block, ring only) — the hard spotlight can't be aimed at a free surface. Add `orContinue:true` to an event/predicate step to also show a Continue escape hatch.
   - **Highlight several elements at once** (e.g. all face-down vampires) -> `ringRect:()=>({left,top,right,bottom,width,height})` (ring + bubble bound the rect, overriding `target`; recomputed each frame so it tracks as cards move).
3. A full-dim explanatory step (no highlight) = `target:()=>null` + `place:'center'`.
4. Branch-only step: give it `allowSkip:true` and a `target()` that returns `null` in the other branch — it auto-skips and `tutVisibleInfo` keeps "Step X / N" gapless (this is how precon-vs-file steps are gated via `tut._dlMode`).

### Add a whole section
1. Add `{ name, desc, steps:[…] }` to `TUT_SECTIONS` and its id to `TUT_ORDER` (sets sequence + the next-section prompt).
2. If it needs a modal open / data loaded first, add a branch to `tutLaunch(secId)` that resolves the prerequisite **before** `tutStart` — open the modal / prompt / load, *then* start. Never show the layer then resolve (blank-overlay flash, `idx=-1` gap). (`decklab` prompts via `tutEnsureDecks`; `lobby` does `offlineCfg=[]; openOffline();`.)
3. Targeting dynamically-rendered rows that have no IDs: use a structural query, e.g. `#offlineSeats > div:nth-child(N) select`.
4. "Do X *again*" gating (a state predicate is already true after the first time): bump a counter from a `tutNotify('your-event')` breadcrumb in the relevant app function and gate on `count > base`, capturing `base` in `onEnter`. Template: `loadPrecon` → `tutNotify('deck-loaded')` → `tut._loadSeq`.
5. Completion is automatic: the last step's advance → `tutFinishSection` records `conv.tutDone` (`tutMarkDone`), offers the next *ready* section (`tutNextReady`, skips stubs), else `closeOverlay()` back to the welcome screen.
6. **If the section starts from the welcome screen (`tutShowWelcome()`), any ALREADY-active hotseat table must be genuinely left, not just visually covered (v2.5.91).** `enterL0()` alone only toggles CSS/view-mode classes and closes floating panels — it never touches `localTable`/`state.cards`/`net.hot`. If a previous chapter's live game is still technically active when the new section tries to open its own setup dialog (`openOffline()` etc.), that dialog's own `if(localTable){ toast('Leave the current hotseat first'); return; }` guard silently no-ops — the tutorial then narrates a lobby that never opened. `tutShowWelcome()` now calls `leaveHotseat()` first when `localTable` is true (which itself calls `enterL0()`, so the two branches are mutually exclusive, not additive). Any NEW code path that shows the welcome screen from inside a tutorial must go through `tutShowWelcome()` rather than a bare `enterL0()`, or it will reintroduce this exact gap.
7. **A section that's optional and independent of the linear basics chain (not "the next thing to learn," but "a separate topic the player may or may not want") belongs in `TUT_ADVANCED`, not just at the end of `TUT_ORDER` (v2.5.91).** Being late in `TUT_ORDER` only controls the picker's *linear-unlock* default (`unlocked = TUT_ADVANCED.has(key) || done.indexOf(prevKey)>-1`) and whether `tutFinishSection`'s "Continue to the next section?" prompt offers it (`tutNextReady` explicitly skips any key in `TUT_ADVANCED`). Add a section's key to `TUT_ADVANCED` when it should always be selectable from the picker regardless of what else is done, and should never be pushed on the player as an automatic "up next" suggestion after finishing something else.

### Classic gameplay sections (3a/3b) — L4 facts
These run on a **live L4 free-board** Classic table (`tutQuickClassic` auto-seats one if none is up). Targeting facts that bite:
- **The dock handle in L4 is `#l2dock`** (the old `#handTab` was archived to `kodarkivering.md` in v2.5.11; `enterL4()` adds `l2mode+l3mode+l4mode+l2cols`). Ring `#l2dock` while closed → `#z-crypt` once the dock is open (the **live** dock's crypt pile — *not* `#dockCrypt`, which was the dead dock's and is also archived).
- **`#statsTab` is `translateY(-80px)` off its layout box** — target its *visual* `getBoundingClientRect`, not `#statsDock`; grow the rect to include `#statsPanel` when `#statsDock.open`.
- **A dragged crypt card → `ready` face-down; a double-click (`influence()`) → `uncontrolled`** (free placement). Gate on the *actual* landing zone for the view (helpers: `tutCryptOnBoard()`, `tutVampsOnFelt()`, `tutFaceUpVamp()`, `tutFaceDownVampRect()`), and gate a "move it" step on the card's `{x,y}` having moved (recorded in `onEnter`), not just `faceDown===false`.
- The whole Classic tutorial table **persists** on two layers: a shared "latest mid-step" mirror (`elysium.tut.game`, flag `tutGameLive` set in `tutStart` / cleared in `startHotseat`, mirrored via `scheduleSave` independent of the autosave mode), AND a **per-chapter entry snapshot** (`tutChapKey(secId)='elysium.tut.game.'+secId`, captured once in `tutStart()` the first time a `classic-*` chapter is reached, never overwritten) that the tutorial picker resumes from when you relaunch an already-completed chapter — see `tutGameSnapshot()`/`tutGameResume()`. `tutEnd`/`tutCancel` (End tutorial / Esc) clears **only** the shared mirror, deliberately keeping the per-chapter snapshots; only `tutResetProgress` clears both (v2.5.31 added the per-chapter layer on top of the pre-existing single-key mirror — see `elysium-learnings.md`). Boards restore exactly; the turn counter resets to turn 1 / VP to 0 on resume (documented trade-off, not yet fixed).
- **L4-specific bug classes to check first if a new L4 step looks broken:** (1) any one-shot UI flag zeroed by `clearTable()` leaks back on every hotseat seat-swap unless it's also round-tripped through `serializeGame()`/`restoreGame()` (see `l4hintDone`; the same per-seat round-trip fixed `net.rtarget`, the cross-board target, in v2.5.10); (2) `net.view`-keyed dispatch chains often omit a `'l4'` branch, since L4 renders opponents into `#l4oppWrap`, not `#rvCards` — this recurred in FOUR functions (`refreshRTargetView` / `roster` / `applyPco` / `giveHot`, all fixed v2.5.9); a ring/visual that updates fine in L2/L3 may silently never repaint in L4 even though the underlying state is correct. The sibling `refreshRTargetMarks()` scanned only `#rvCards` while L2/L3 cards live in `.l2pane2` / `#l3stage` — fixed to a document-wide `.card.rc` query.

### Simulating an opponent via a real hotseat seat-swap (mid-tutorial)

### Structured gameplay sections — L2/L3 facts
These run on a **live Structured hotseat table** launched interactively through the lobby (the tutorial walks the player through setting Board style, Tournament mode, and clicking Fill Table + Start). Key differences from Classic tutorial sections:
- **The section starts from the welcome screen** — `tutLaunch` routes via `tutShowWelcome()` + `tutStart()`, NOT `tutQuickStructured()` (no auto-seating; the lobby steps ARE the tutorial content).
- **The `tutTick` guard uses `tut.idx>6`** because the first 7 steps (indices 0–6) walk through the lobby BEFORE `localTable` is true. If lobby steps are added or removed, this threshold must be updated.
- **Lobby `onEnter` steps set controls programmatically** — always use the same helper chain the UI uses (e.g. `syncOffTournament()` after changing `$('#offBoard').value`).
- **Navigation gates:** Prey/Predator fold state lives in `net.l2fold.prey`/`net.l2fold.pred` (true=folded in); L3 overview is `net.view==='ov'`; a seat visit is `typeof net.view==='number'`.
- **Phase helpers are ON** (Tournament mode OFF) — the phase bar shows all five phases; `state.phase` tracks which is active (0=Unlock, 1=Master, 2=Minion, 3=Influence, 4=Discard, -1=none).
- **The same persistence mechanism works** — `tutStart` captures an entry snapshot via `tutChapKey('structured-intro')`, and `tutClassicKeys()` returns both classic-* and structured-* keys for Reset progress.

### Simulating an opponent via a real hotseat seat-swap (mid-tutorial — Classic only)
For a step that needs an "opponent" to actually react (not just be described), swap real control to their seat rather than scripting a fake reaction:
1. **Hand control over:** target `#statsTab` with `ringRect:tutTableRect` (reused from the onboarding `ci-table` step); in `onEnter` capture `tut._handoffSeat=mySeat()`; gate on `mySeat() !== tut._handoffSeat` — the player must actually click the other seat's row in the Table panel (`#statsBody .srow.click` → `setActivePlayer`, pre-existing hotseat machinery, no new code needed). State `text` that this is **hotseat-only**.
2. **Steps while "as" the other seat** work unmodified — `tutVampSelected()`, `qrPhasePlayed.size` baseline-diffs, etc. all read the now-active seat's live `state` correctly (no extra plumbing; `qrPhasePlayed` in particular is a single un-seat-scoped `Set`, only cleared on phase change, so it correctly accumulates across the swap).
3. **Hand control back silently before the section ends:** in the final step's `onEnter`, `if(mySeat()!==tut._handoffSeat) setActivePlayer(tut._handoffSeat, {quiet:true});`. **Surface this in the step's own text** ("you're back in your own seat now…") — a silent hand-back with no on-screen cue reads as a bug to the player even though it's working as designed.
4. **Detecting an action with no existing `gate`-friendly state** (e.g. "did the player click this specific button / pick this specific menu item"): add a one-line breadcrumb flag at the real call site (`tut._reactClicked=true` in the `#btnDecide` handler; `tut._lastSaidIdx=i` in `saySend(i)`) and gate on the flag with `advance:{on:'manual'}`. Prefer this over `advance:{on:'event', name:…}` + `orContinue:true` when the step must genuinely block Continue — event-only steps never grey the Continue button (`next.disabled` is only ever set when `s.gate` exists), `orContinue` just adds a skip-escape-hatch on top.

### Rules
- Stay `tut*`-prefixed; never inject into `state.cards`/`state.zones`.
- The step-aside hides the layer only over `#dialogModal` (alerts/confirms). Content modals you highlight inside (Deck Lab, lobby) must stay visible — don't gate it on `#overlay`.
- **Side effects that should fire only on *advance* (open a view, start something) go on the NEXT step's `onEnter`, not the current step's `onExit`** — `tutEnd()` (End/Esc) fires the *current* step's `onExit`, so it would also run on End. To begin a section on the welcome screen, highlight the entry button, then open the view from the following step's `onEnter`. `tutShowWelcome()` routes back to the welcome screen and is what **End/Esc** use (`tutCancel`).
- Same gates as any client change (syntax · 16/16 · byte-identical round-trip). The tutorial has **zero** sandbox coverage for render/interaction — Johan's live test is the only gate there.

### v2 additions (engine pass — slice 3c, Crypt rework)
- **Branching** is now `skip:()=>bool` (cleanly skips the step in `tutGo`), replacing the old `allowSkip:true` + null-target trick. E.g. `skip:()=>!tut._playWithVamp`.
- **`gateHint` may be a function** — re-evaluated every frame in `tutTick` for live text (e.g. `()=>'Dragged out '+n+' of 4'`).
- **All gated steps must be `freeInteract`** so the click that satisfies the gate reaches the board (a centre/dim step blocks "click the felt").
- **Highlight a right-click path:** `menuHi:['Actions','Bleed']` glows the matching `.mi` rows (exact textContent). **Highlight the nav buttons:** `hiNav:true` (pulses `#tutEnd`/`#tutNext`).
- **Keep the box off an element** (beyond the highlighted hole): `avoidRect:()=>rect` — added to `tutPlaceBubble`'s collision-avoidance (used so the Crypt panel box dodges the dragged-out vampires).
- **The bubble is draggable**, and its arrow auto-aims at the target from wherever it ends up (`tutArrow`) — no extra step config as long as the step has a `target`/`ringRect`.
- New helpers: `tutFaceUpVampObj()` (the face-up vampire OBJECT, vs the boolean `tutFaceUpVamp`), `tutVampSelected()`, `tutDockRect()` (open-dock union rect). Clones during the tutorial render via top-level `#cardFxTop`.
- **Before changing any z-index** see `elysium-learnings.md` -> "Z-index / stacking layer map".

## Skill: Verify a change — client/server track (the full gate sequence)

The reliable sequence after any client or server edit. **Counts drift as suites grow —
always trust the suite's OWN printed total over any number written here; these are last-
known-good, not a contract.**

```bash
# 1. Client syntax
sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -

# 2. Re-derive fragments and prove byte-identity (see "Re-sync the fragment build" —
#    build to a SCRATCH file and cmp; never trust the default-overwrite path)
cp elysium-vtes-bord.html /tmp/original.html && python3 split_client.py && rm -rf elysium-src && cp -r /home/claude/elysium-src elysium-src && node elysium-build.js /tmp/rebuilt.html && cmp /tmp/original.html /tmp/rebuilt.html && echo byte-identical

# 3. Client logic suite — loads the REAL client via elysium-test-harness.js, so this is also the load gate
node test-client-logic.js        # last known: 29 passed, 0 failed

# 4. Server syntax (if server was changed)
node --check elysium-server.js

# 5. Server dispatch (if server was changed)
node test-server-dispatch.js     # last known: 18 passed

# 6. Protocol lint (if a wire verb/field changed)
node test-protocol-doc.js        # asserts §-numbered examples match the code

# 7. Bump VERSION in the client (and server if protocol changed), then check-versions.js
#    (full output, never truncated — a truncated run once hid a live version-lockstep break)

# 8. Deliver: cp to /mnt/user-data/outputs/, present_files (client/bot file first)
```

### What the sandbox CAN verify since 12 Oct 2026 — drive the real client in headless Chromium

Chromium and Playwright are pre-installed (`require('/opt/npm-tools/node_modules/playwright')`; never run `playwright install`). Keep the script in the scratchpad, not in the repo.

```js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1500, height: 900 } });
pg.on('pageerror', e => errs.push(String(e)));              // a clean run has none
await pg.goto('file:///abs/path/elysium-vtes-bord.html'); await pg.waitForTimeout(700);
await pg.evaluate(t => { closeOverlay(); startHotseat([{ name:'You', deckText:t }, { name:'Anna', deckText:t }], 'structured'); }, deckText);   // 'classic' = the free board
await pg.mouse.move(900, 895);                               // real hover: opens the dock
await pg.screenshot({ path: 'dock.png' });                   // then LOOK at it
```
- Top-level `let`/`const`/functions of the client are reachable inside `evaluate` (`state`, `net`, `conv`, `dockPinned`, `processCardData`, …).
- The card database: no network here — pass a `vtes.json` you have on disk into `evaluate` and call `processCardData(db,'test')`. Card images do not load; text cards render.
- For a fix, run the SAME script against the previous client (`git show HEAD:client/elysium-vtes-bord.html > /scratch/prev.html`) and report both.
- **Single vs group audit (v2.6.144):** build two of each kind with `makeCard` + `move` (uncontrolled face down, ready face up with blood and a lock, ready face down, a library card in play, a vampire in torpor), `window.__snap=serializeGame()`, and per trial `restoreGame(window.__snap,{keepLog:true,silent:true})` → select (`clearSel(); addSel([ids])`) or not → real mouse drag to the target zone's rect (for a dock zone, drag to the bottom edge first and wait for the dock) → read `zone / faceDown / locked / blood` of both cards. A cell is suspect when the card's outcome in a group differs from its outcome alone.
- Park the pointer on empty felt between trials — the top centre opens the Played tab over the cards. Close any dialog a trial opened before the next one.
- **A hotseat with bots (v2.6.159):** seat a bot through the real Play offline dialog (store a deck with `storeDeck`, click the seat's 🤖, `selectOption` the decks, click `#offStart`; the real server serves `elysium-bot.js` beside itself). Set Turn-based with `botCfgSet({tempo:'turn'})` and answer the bot yourself (`hotBots[2].status()` says what it waits for; `saySend(1)` = No block). Call `pass()` without awaiting it (it awaits the bots' sweep) and never twice (a page flag around its promise). **While a bot acts, the camera shows ITS board** (`#rview.show`): click `#rvBack` (⌂ Home) before right-clicking your own minion. A bot's bleed is `hotBots[seat]._actingVamp` = `{ v, n, target }` (no `kind`, the name in `v.name`). A bot flag (`b.edge`) flips before its message leaves the paced send queue: wait for the effect, not the flag. **(v2.6.162)** Before you touch a bot's board, wait for its deal (`hotBots[s].started && hotBots[s].unc.length >= 4 && hotBots[s].hand.length >= 7`): a late `dealt` resets `board`, `unc` and the pending action (the likely cause of one failed run in fifteen). Then check the precondition with the bot's own function (`_pickBlocker(new Set(), new Set(), { kind:'bleed', who, actingVampName })`). To force a choice, wrap the instance's `decide` for one key (`'block-as-target'`). After any chat line a bot sends nothing for 1.6 × paceMs (4.96 s at the client's 3.1 s), so read its decision on `status()` and its line in the log separately, and give a line about 6 s. The Bot Activity panel repaints at 4 Hz: judge its DOM from the first sample that agrees with `status()`.
- **A 'nothing happens' check needs its control (v2.6.160):** "a wheel over the eye does not zoom" counts only next to "the same wheel over the mat zooms". In Structured's helicopter view only bare felt pans (`e.target!==board`), so a drag test on a mat cannot bite at all — check the wheel. Close a menu with `hideMenu()`: Esc also goes Home and leaves the view you were measuring.
- Still not verifiable here: touch, sound, animation feel, KRCG's images, online play across machines.

### Judge a small icon on the pixel grid (13 Oct 2026, v2.6.147)

For a glyph of 16 px or less, decide with pictures, at the density most screens have.

- Draw the icon as ONE inline SVG path with `fill:currentColor`, in its resting pose (the dock pin: point down). State changes are CSS on the parent's class (`.on svg{ transform:none }`), never new markup.
- Sheet 1: every candidate shape × angle at real size and at 4×, on the panel's own background, `deviceScaleFactor: 2` — for the shape.
- Sheet 2: the same at `deviceScaleFactor: 1`, screenshot the real-size row, then show that PNG at 6× with `image-rendering:pixelated` — for legibility. Diagonals lose here; choose 0° / 90° when the size is small.
- Then in the real client: `getComputedStyle(svg).transform` → the angle (`atan2(b, a)` of the matrix), `elementFromPoint` at the button's centre (it must be the button or inside it), the `title`, and a real click. Crop the corner at 1× and 2×.
- A text check that survives an icon button: `textContent === ''`, the `title` per state, `aria-pressed` per state.

### Review the other half's code path against ours (13 Oct 2026, the Classic review — no code)

When the question is 'does THEIR path work on OUR surface' (the bot at a Classic table). `bot/` is read and run, never edited; every script is scratch.

1. **Read for assumptions.** List what their code takes for granted about ours (a comment like 'every ready card is face-up', a coordinate that means 'my mat', a loop with no bound beside a clamp). Each one is a probe.
2. **Unit, no socket.** `const b = new BOT.Bot({ name, room: 'x', deck: BOT.ARCHETYPES.hacking, log(){} }); b.caps.classic = true; b.seat = 2; b.players = [...]` — then call the function. Anything that may not return runs in a child process with a timeout.
3. **The soak per board style.** `SOAK.loadDeps(client, bot)`, wrap `loadClient` so `A.hotBridge._boardMode = mode`, `SOAK.runTable({ decks, pool, rounds }, { BOT, loadClient, fx, idleMs, persona })`, ONE TABLE PER PROCESS. First with a measuring guard on the suspect (same scan, a bound, a record), then without it; a `setInterval` dot on stderr dates the last breath when the parent kills it.
4. **A live table.** The real server, a browser as the human host, and each bot in its own Node process: `new BOT.Bot({ server: 'ws://localhost:' + port, room, name, seat, deck, paceMs: 400, askSecs: 3, tempo: { tempo: 'standard', waitSecs: 1 } }).connect()`. The bot uploads its deck and claims its seat by itself; start when the lobby shows every seat with a deck. The human draws, arranges and passes by mouse and `pass()`; click `#dlgOk` when a dialog opens.
5. **A stopped bot** has written nothing for 6 s AND its process burns a core (`/proc/<pid>/stat`, fields 14 + 15). A stopped LOBBY bot is a page that no longer answers: `Promise.race([page.evaluate(...), timer])`. Then KEEP WATCHING past every timer that can still fire — the server reaps a silent socket after 75 s on a 30 s tick, so 140 s — and seat a second human to see what the table is told. Try the host's own tools (right-click the seat's globe: ⏭ Pass their turn…, 💀 Oust this player…) before writing what the table can do.
6. **A fixed opening** without touching their code: the bot's own `rig: { hand, ready: [{ name }], unc }` option.
7. **What one seat concludes about another:** read their model directly (`bot._opp(seat)`, `_preyUnlockedN()`, …) after each real gesture in the browser, or replay the `board` frames a second browser RECEIVED (`pg.on('websocket', ws => ws.on('framereceived', …))`) into an offline bot.
8. **Report** each claim as run or read, what ran fine, and what was not looked at. A pattern in a handful of runs is measured before it is written down.
9. **Before it goes out:** give the finished document, the code paths and the evidence files — nothing else — to a reader who did not do the work, with the brief 'find what is wrong, unsupported or imprecise'. Save every probe's output to a file first, or the reader cannot check it.

- After a flip the reveal clone covers the middle of the felt for about three seconds; a pointer resting on a face-up card keeps its tooltip under the next press. Park on bare felt and wait.
- The Played tray pins itself when any resolver opens (helper on) and stays: close it (`closePlayed()` or Esc) before photographing the top of the felt, or photograph it on purpose.
- A table that has gone quiet is a test of its own: redraws that depend on someone's next message do not happen (the free board lost every other seat's cards after a roster change, and nobody had seen it on a busy table).
- The sandbox has no card database: for a reader that needs one field (`detectClan` reads `clansArr`), inject a stand-in `cardInfo = new Map([[norm(name), { clansArr: ['Ventrue'] }]])` and say so.

### Drive the real server with real browser clients (13 Oct 2026, v2.6.146)

For anything online: the unit suites feed handlers made messages; this runs the real pair. Scratch scripts only, one run at a time, never beside the suite.

```js
const p = spawn('node', [SERVER_JS, String(PORT), CLIENT_HTML, '--data-dir', scratchDir]);      // ready when stdout says 'Local:'
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });               // ONE CONTEXT PER PLAYER: own storage, own socket
const pg = await ctx.newPage(); await pg.goto('http://localhost:' + PORT + '/');                // localhost opens in Full mode
await pg.evaluate(() => { closeOverlay(); openMP('create'); }); await pg.click('#mpGsToggle');   // Game settings
await pg.fill('#mpName', 'Johan'); await pg.fill('#mpRoom', 'bord'); await pg.click('#mpCreate');
await pg.waitForFunction(() => net.lobby === true);
// a guest: openMP('join'), #mpName, #mpRoom, #mpJoin   (a spectator: check #mpSpect first)
await pg.evaluate(d => buildDeck(parseDeck(d)), deckText);                                       // then back to the lobby: openOverlay('lobbyModal'); renderLobby()
await pg.click('.lobseatbtn[data-seat="1"]');                                                    // only after EVERYONE has joined -- the picker's range is the player count
await host.click('#lobStart');
```
- **What one player sees of another:** `net.boards[seat].pub` — `cards` (zone, x, y, faceDown, and no `name` when face down) and `tokens` (the pool globe).
- **Claim seats in another order than the join order,** or the run says nothing about seat order.
- **An old client at a new table:** start a second server process that serves the old file (`node elysium-server.js <port2> old-client.html`), open the page from there, and type the first server's address into `#mpAddr` (`mpFold('srv', true)` unfolds it). **An old server:** spawn the old file (`git show <rev>:client/elysium-server.js > scratch/old-server.js`).
- **The log is shared:** every player's deal line shows in every log (five players, five lines).
- **A bot from the lobby:** `#lobBotAdd`, then wait until `netBots` holds it and the lobby shows its deck. It claims the first free seat by itself; the humans take what is left. The server needs the bundle beside it.
- **A mid-game join leaves the Join dialog open** (`#mpClose`) **and the client on the start view until Esc.** Do both before reading the table, or you measure an empty one.
- **A reloaded tab keeps its seat token** (sessionStorage): Resume on the welcome card restores the saved table, Join game then takes the seat back. `net.ws.close()` in the page is a dropped socket; the client rejoins by itself after 2.5 s.
- **Run the same script against the previous release** before calling anything a regression — both files as arguments.
- **Count what a client sends** (v2.6.148): `pg.on('websocket', ws => ws.on('framesent', f => …JSON.parse(f.payload).t…))`. A watcher must send no `board` and no `log`.
- **Every arrival, both board styles** (v2.6.148), whenever `joined` / `started` / the views change: a spectator from the lobby, a spectator mid-game, reload → Resume → Join, reload → Join → restore, and `net.ws.close()` while visiting a seat (the view must stay). Drag the globe and a card first, compare positions after.
- **Touch** (v2.6.161): a context with `hasTouch: true` (the client then sets `body.touchui` itself, through
  `any-pointer:coarse`). `page.touchscreen.tap(x, y)` is a tap. A long-press through the client's own engine:
  `cdp = await ctx.newCDPSession(pg)`, then `Input.dispatchTouchEvent` with `touchStart` at the point, wait 700 ms, then
  `touchEnd`. It is emulated touch: an iPad or a phone is still a separate test.
- **Measure a view from every way in** (v2.6.161), whenever `switchView` or a view's enter or exit changes:
  - Home → visit, helicopter → visit, visit → visit;
  - out again by ⌂ Home (`#rvBack`), Esc and V;
  - at 1366×768, 1920×1080, 1280×720 and 1024×768 (`pg.setViewportSize`).

  For a visit, compare `#rview` with `#tableArea`, check that ⌂ Home is inside the window, that `#l2dock` is shown in
  Structured, and that `board.style.transform` is empty. Measure at 0.3, 1 and 2.5 s. A Classic visit is sized in code
  and follows the side panel's transition, so judge it at 1 and 2.5 s.
- **Did frames stall?** (v2.6.161) Sample `performance.now()`, a requestAnimationFrame counter and
  `document.timeline.currentTime` from a 25 ms `setInterval`. If timers tick while the frame count and the timeline stand
  still, CSS transitions are waiting too, and a timer that measures sees the old geometry.
- **Is it shown?** Use `el.getClientRects().length`. `offsetParent` is null for `position:fixed` elements, such as the
  L2 peek tabs.
- Kill the server processes in `finally`, end the script with `process.exit(0)`, and give each run a fresh `--data-dir`.

### What the sandbox CANNOT verify (client track only — the bot track below largely CAN)

- Any visual/rendered behaviour (animations, layout, views)
- Any runtime interaction (drag, menus, hover)
- Hotseat switching and turn flow
- The L3/L4 helicopter and free-board views

**Always say explicitly** what needs live testing.

---

## Skill: Verify a bot-track change (elysium-bot.js / cardfx / the arena)

Unlike the client, most bot behaviour genuinely IS testable in-sandbox: `test-bot-logic.js`
spins up a REAL server on a random port and drives REAL WebSocket clients against a REAL
connected `Bot` instance — this is integration testing, not a mock.

```bash
node --check elysium-bot.js
node --check cardfx-compile.js        # if the compiler changed
node cardfx-compile.js vtes.json cardfx-curated.json elysium-cardfx.json   # recompile if cardfx changed
node test-cardfx.js                   # last known: 46/0 (includes a no-drift check against the compiled JSON on disk)
node test-bot-canary.js               # last known: 37/0 — §12 wording drift, sub-second, no network
node test-bot-logic.js                # last known: 119/0 — RUN THREE TIMES (see the stability note below)
node check-versions.js                # full output; expect "everything agrees"
node /tmp/smoke-table.js              # if it exists this session; recreate from elysium-bot-table.js otherwise
```

- **Run `test-bot-logic.js` at least 3 times before trusting a green result.** Timer-driven
  races (react-delay, the token-bucket pacer, `askSecs`) surface intermittently; a single
  green run is not proof. A flaky assertion that passes 2/3 times is a real bug, not noise.
- **Since v0.5.0 the suite takes noticeably longer wall-clock (roughly 70–170s observed,
  vs. a much shorter runtime before Hunt existed).** Hunt asks Block? too, same as Bleed,
  so a low-cap-crypt deck (Zip/Anarch Convert/Lisa Noble, cap 1–2) now hits the mandatory
  hunt rule often, adding real `askSecs`-bound waits per turn across the whole suite —
  this is correct new behaviour, not a hang; if your own shell/CI wraps the run in a
  timeout, give it real headroom (150s+) before assuming a failure. The one arena-based
  assertion (section 12) explicitly overrides `askSecs:1` (was the arena's own default of
  3) to keep that one test's wall time comfortably inside its `matchTimeoutMs`.
- **Bump `BOT_VERSION`** (own version line, independent of client/server `VERSION`) and
  `FXC_VERSION` in `cardfx-compile.js` if the compiler changed. Neither is covered by
  `check-versions.js`'s wire-verb lockstep check — bump them by convention, not gate.
- **If cardfx changed**: recompile BEFORE running `test-cardfx.js`, or the drift-check
  fails correctly (that's the gate working, not a bug — the compiled JSON on disk must
  match a fresh compile of the same compiler + source).
- **The suite spawns its OWN server copy in a tmp dir** (the room-store is
  `__dirname`-anchored; running against the checked-out `elysium-rooms.json` once hit
  `MAX_ROOMS` and bricked every `create`). Never delete this pattern when editing the
  suite's bootstrap.
- **Deliver**: `elysium-bot.js` + whichever of `test-bot-logic.js` / `test-bot-canary.js` /
  `cardfx-compile.js` + `elysium-cardfx.json` changed, first in the `present_files` list.

---

## Skill: Add a bot `decide()` case

Every behavioural fork goes through the `decide(q, ctx)` seam, never inline logic in the
caller — this is what makes each decision traceable (`_emit('decide', {q, out, ...})`)
and unit-testable in isolation.

1. **Add the `case 'name':` in `_decide`** — read only from `ctx` (the caller's job) and
   `P` (the resolved persona). Return a plain object; always include a `why` string built
   from the ACTUAL numbers used (`'blockShy ' + P.blockShy + ' × odds ' + odds.toFixed(2)...`)
   — this is the only diagnostic a live-test session gets, so make it reconstructable.
2. **Build `ctx` at the call site** from state the caller already has — don't reach back
   into `this.*` from inside `_decide`; keep the seam pure-function-shaped even though the
   class technically allows either.
3. **If the decision needs a "how much do I have" estimate** (e.g. `interceptPotential()`),
   make sure that estimator reads the SAME ledger/capability constraints the EXECUTION side
   will enforce — see "Decision and execution must read the same state" below. This is the
   single most common bot bug class this session produced (twice, in two different forms).
4. **Test both ways**: an offline unit for the pure threshold math (cheap, exact-number
   assertions), and a live network scenario for the end-to-end wire behaviour (see the next
   skill). Neither alone is sufficient — offline units don't catch wiring bugs, live tests
   don't cheaply cover the numeric edge cases (ties, zero, negative).

## Skill: Add or extend a cardfx fx tag (the compiler)

Facts live in `elysium-cardfx.json`, derived by `cardfx-compile.js` from KRCG's `vtes.json`.
Never hand-edit the compiled JSON — it regenerates from source and a hand edit silently
reverts on the next compile.

1. **Decide the granularity FIRST**: is the fact true of the whole CARD (e.g. `unique`,
   `limited`, `cost`, `req.disc`) or can it differ BY MODE (e.g. `dir`, and most `fx.*` tags
   themselves)? Getting this wrong is exactly how `dir` shipped wrong the first time —
   Govern the Unaligned's directed bleed (inferior) and undirected blood-add (superior) are
   the same card, opposite answers. When in doubt, mode-level is safer; entry-level facts
   are only correct when the property truly cannot vary within one card.
2. **Entry-level facts**: detect in `libEntry()`, scanning the whole `card_text`.
3. **Mode-level facts**: detect INSIDE the `segs.forEach` loop in `libModes()`, scanning
   `s.text` (that segment's OWN text, already isolated by the discipline-requirement
   splitter) — not the whole card. Thread the value through the `done.push({...})` call and
   the `map.get(key)` assembly step alongside `fx`, exactly like `dir` does.
4. **"As above" inheritance**: if the new fact should carry forward when a segment says
   "As above, but…", inherit it from `src` the same way `fx` does (`if(dir === undefined)
   dir = src.dir`) — don't assume; some facts (e.g. a cost that changes) should NOT inherit.
5. **Recompile, then look up a REAL card you expect the tag on** (`node -e` one-liner
   against the fresh `elysium-cardfx.json`) before writing any test assertion — confirms the
   extraction actually fired, not just that the compiler didn't crash.
6. **Empirically check the minority/majority split** before choosing tag polarity (which
   value gets the sparse `true` tag, which is the silent default) — measure at the SAME
   granularity the tag actually lives at. An entry-level measurement of a mode-level fact
   will misreport the split (this session's `dir`: entry-level looked like ~53/47, the true
   per-mode split was 180/461 — nearly 2× off, because split-mode cards got double-counted
   under the wrong entry's polarity).
7. **Gate**: `test-cardfx.js` includes a no-drift check (compiled JSON on disk must match a
   fresh compile) — always recompile before running it, or the drift check fails correctly.

## Skill: Test a bot behaviour — offline unit vs. a live scripted room

**Offline unit** (no server, no network, instant): construct a bare instance and poke its
fields directly — this is the established pattern for pure decision/helper-method testing.

```js
const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'U', log: () => {} });
u.board = [{ id: 'c1', name: 'Zip', kind: 'crypt', zone: 'ready', locked: false, blood: 2 }];
u.hand = ['Card Name'];
// call the method/decide() case directly, assert on the return value
```
Never call anything that reaches `send()` on an unconnected instance without cleaning up
afterward — `send()` queues to `this._sq` and `_drain()` schedules a `setTimeout` retry loop
that runs forever with no `this.ws`; a leaked timer keeps the test process alive.

**Live scripted room** (real server on a random port, real `Bot.connect()`): needed for
end-to-end wire behaviour — §12 line parsing, tally writes, multi-step reaction sequences.
Determinism gotchas, all found the hard way this session:
- **The server SHUFFLES both piles on `start`** (`shuffle(g.lib); shuffle(g.crypt)`) — a
  multi-card-type deck can NOT be trusted to deal specific cards to the opening hand. For a
  scenario needing several DIFFERENT named cards at once, directly mutate `bot.hand =
  [...]` (and `bot.board[i].locked = true` etc.) after the `'dealt'` event — same
  poke-internal-state pattern as the offline units, just on a live connected instance. A
  mono-card deck (`library: [{name: X, qty: 60}]`) is the right tool ONLY when a single
  repeated card is all a scenario needs.
- **`poolFloor` defaults to 6** ("never influence below this pool") — if `startPool` is set
  at or near that, NO vampire will ever enter play via influence. Override `poolFloor: 0`
  explicitly for scripted-room tests unless the floor itself is what's under test.
- **`waitFor` is cursor-based and consumes forward, never backward.** Write sequential waits
  in the bot's ACTUAL send order, not the order that feels natural to check — if message A
  is sent before message B but you `waitFor(B)` first, the cursor scans past (and silently
  consumes) A while searching for B, and a later `waitFor(A)` then times out. When unsure of
  order, dump `client.inbox.slice(-N)` once to see the real sequence before writing asserts.
- **A fresh `_armPending` SUPERSEDES a stale one automatically** (documented client/bot
  behaviour) — sequential bleed-vs-target sub-tests in the same room don't need an explicit
  cleanup verdict between them; sending one anyway can trigger unwanted side effects (an
  extra combat round, a needless pool deduction) that only cost you later in the same room.

## Skill: Bot-logic review checklist (what a plain “does the test pass” run won't catch)

Run this whenever a bot decision path is new or changed, gate-green or not — all three
items in this checklist were real bugs this session, found only by asking these questions
directly, never by a failing assertion:

- **Decision and execution must read the SAME state.** If a `decide()` case estimates “how
  much/which one do I have” (e.g. summed capability across several board pieces), the
  method that actually COMMITS must filter by the identical constraint (a once-per-action
  ledger, a lock state, a cost-affordability check) — not a looser or differently-ordered
  version of it. Grep for every place that answers the same question and confirm they share
  one code path or one explicit parameter, not two independently-maintained approximations.
- **Audit the rulebook BOOKKEEPING side-effects separately from the outcome.** A combat/
  block/reaction path can produce a perfectly correct damage number, torpor flag, and chat
  line while still forgetting to lock the acting minion, pay its cost, or pass the Edge —
  the "does it feel right" read of a test's assertions won't surface this because nothing
  asserted the bookkeeping at all. List each rulebook side-effect a mechanic requires (lock?
  blood/pool cost? Edge? draw-back?) as its own line item and assert it explicitly.
- **Verify a game-rule claim against source before encoding it, and test the SMALLEST table
  as an explicit edge case for anything target-related.** Rulings live at vekn.net's
  rulebook and Black Chantry's clarifications — check them before writing target/legality
  logic, not after a test looks weird. A 2-player (heads-up) table is the sharpest edge
  case for “who can this target” logic specifically: predator and prey collapse onto the
  same seat, which silently breaks any rule phrased as “another Methuselah” (bounce
  effects, some directed-action legality). If a rule's implementation degenerates to
  something nonsensical at the smallest table size, that's the source-verification signal,
  not a reason to special-case the test away.
- **A zone's current POPULATION COUNT is not its next FREE SLOT (v0.4.5).** Any pure
  idx→{x,y} placement formula (`slot(zone,idx)`) has no memory of who's already there —
  deriving `idx` from "how many cards occupy this zone right now" only holds while the
  zone stays contiguous 0..N-1, which breaks the moment a card leaves that zone OUT OF
  TURN (a combat torpor, a manual ctrl zone toggle) and frees a MIDDLE slot without the
  rest re-indexing. Scan for the first unoccupied `slot(zone,idx)` (`_openSlot`) instead
  of counting, and once you find one instance of this shape, grep every OTHER idx-from-
  count or hardcoded-index call in the same file — this session it recurred FOUR times
  (the influence raise, combat's torpor placement, the ctrl torpor/untorpor toggle, and
  `_addUnc`) before the pattern was named and fixed everywhere at once.
- **A "pace" is a GATE (wait since the last action), not a `sleep()` at scattered call
  sites (v0.4.5).** A fixed `sleep(paceMs)` inserted at specific lines only proves those
  lines wait — every OTHER phase transition or multi-card reaction step the same sweep
  didn't touch stays unpaced. Track a timestamp (`this._lastActAt`) and wait only the
  REMAINDER since it, so the same call is safe to sprinkle before every visible bot
  command without stacking a needless extra wait on top of a step that already took a
  while (a human's reply, a network round trip). Functions this pulls into `async` need
  their call sites re-checked: a direct `await` where already inside another async
  function, the established `somePromise().catch(e => this.o.log(...))` fire-and-forget
  shape where called from synchronous dispatch code.

## Skill: Extend the §12 contract canary (`test-bot-canary.js`)

Whenever a NEW frozen, bot-parseable log-line format is added (a new entry in PROTOCOL §12,
a new regex in the bot's `L12` object): add a corresponding cross-check to the canary in
the SAME delivery. Pattern to follow (the file already has five examples): extract the
CLIENT's real line-building code where it's an isolable pure function (`new Function(...)`
against the extracted source, never a hand-copied reimplementation); for non-isolable
builders (ones touching DOM/other state), assert the load-bearing literal fragments still
exist verbatim in the client source; either way, feed a concrete sample through the bot's
REAL exported `L12` regex (already `module.exports`-ed — no bot changes needed to reach it)
and assert it parses. Before trusting a green canary on a new check, prove it actually bites:
mutate a throwaway in-memory copy of the wording and confirm the assertion correctly fails.

---

## Skill: Debug an online / tunnel connection problem

The server hosts the page AND the WebSocket on one origin (default port 8123). Most "can't connect" reports are a mismatch between how the page was *served* and how the client *builds its socket URL*.

### Decision tree

1. **Page loads but joining fails?** The static leg (HTTP → tunnel/LAN → 8123) works and the **WebSocket leg** is broken. Don't try more addresses — reason about scheme + port.
2. **Over a Cloudflare tunnel (`https://...trycloudflare.com`)?** The address must be **portless** → `wss://host` on 443. Cloudflare never exposes 8123 publicly, so `cleanAddr()` must NOT append `:8123` over https (and strips a stray one). The friend opens the tunnel link and clicks Join with the pre-filled address — never types a port.
3. **Same-LAN, no tunnel (`http://192.168.x.x:8123`)?** Here `:8123` is correct and `cleanAddr` appends it; the socket is `ws://host:8123`.
4. **"Mixed content" / socket blocked in the console?** An https page can only open `wss://`. `mpConnect()` picks the scheme from `location.protocol` — verify it resolves to `wss://` on the tunnel.
5. **Second+ player rejected as "too many connections"?** A per-IP limit isn't exempting/repointing loopback. Behind a tunnel every player is `127.0.0.1`. The connection cap and create cap exempt loopback; the password-fail throttle uses `failKey = loopback ? 'room:'+room.name : conn.ip`.
6. **Connection drops after ~100s idle?** Cloudflare's idle timeout. The 30s server WS ping should prevent it — check the keepalive interval is alive (and the 75s reaper isn't firing early).
7. **Spurious "version mismatch" on connect?** Client and server are on different major.minor. `verMM` compares major.minor only — bring them into lockstep.

### Key facts

- `cleanAddr` port logic is **scheme-driven**, not address-driven: the page's own scheme tells you the transport.
- The address field defaults to the live `location.host` over https (tunnel URLs change every restart); stored addresses are kept only on http.
- `copyInvite` is scheme-aware: an https invite is shareable as-is; an http invite is LAN-only and says so.
- None of this is verifiable in the sandbox (no network) — it's guarded only by Johan's live two-client test. Say so.

---

## Skill: Debug a problem in the sandbox

Elysium's error handling routes through a 64-entry ring buffer. Use these tools to see what went wrong.

### In the browser (Johan's machine)

Open DevTools console and call `elysiumDbg()`. It prints all buffered entries (newest last) with timestamp, tag, and message. Each entry looks like:

```
HH:MM:SS  mpOnMsg  -  Cannot read properties of null
```

Enable live output: open Settings → Convenience → Debug mode (`conv.debug = true`) — then every `dbg(tag, e)` call also `console.warn`s in real time.

### In the sandbox (Node / test harness)

`dbg()` doesn't throw — it's a pure ring-buffer push. The test harness stubs it (`global.dbg = () => {}`). If you need to inspect calls during a test, replace the stub temporarily:

```js
const calls = [];
global.dbg = (tag, e) => calls.push({tag, msg: String(e)});
// run the code under test…
console.log(calls);
```

### Common tags

| Tag | Set by |
|-----|--------|
| `'mpOnMsg'` | WebSocket message handler (all online paths) |
| `'restoreGame'` | `restoreGame()` on corrupt save data |
| `'warmImgCache'` | IndexedDB iteration errors at startup |
| `'imgDownload'` | Download errors in `downloadImages()` |

---

## Skill: Work with KRCG card data

The card database is loaded on demand from `https://static.krcg.org/data/vtes.json` and optionally cached in IndexedDB. **As of v2.5.87 this file can be in either of two shapes** — see "v3/v5 dual format" below before assuming a field name.

### Key structures

| Variable | Type | Holds |
|----------|------|-------|
| `cardInfo` | Map | name → card record (all name variants as keys — 3 for v3, `printed_name`+every `name_variants[].name` for v5) |
| `cardImageNames` | Set | one canonical `norm(...)` key per card — use for downloads/sync |
| `cardTypes` | Map | `norm(name)` → the raw card types array (`['Vampire']`, `['Action','Reaction']`, …) |
| `precons` | Map | preconstructed-deck entries keyed `"<set> :: <precon>"` (Deck Lab catalog source) |

### Call graph

```
loadCardDB()              ← UI entry point (Settings toggle / welcome button)
  fetchVtesJson()         ← handles cache-vs-network; reads/writes IndexedDB `_vtesJson`
    processCardData(data, src)     ← per card, detects v3 vs v5 (typeof card.kind==='string')
      parseV3Card(card) / parseV5Card(card)  ← each returns the SAME {meta, typesArr, names, imgName} shape
      buildPrecons(list)  ← same detection, same dual branch, feeds the Deck Lab catalog
      imgSyncCheck()      ← downloads missing images if conv.imgSync is on
```

### Guard before using

```js
if (!cardInfo) {
  log('Card database not loaded — enable it in Settings → Files → Card database.');
  return;
}
```

### Lookup pattern

```js
const meta = cardInfo.get(norm(name));      // handles aliases + printed_name, either format
if (meta) { /* meta.disc, meta.clansArr, meta.cap, meta.path, meta.sect, meta.text, etc. */ }
```

### v3/v5 dual format (v2.5.87)

KRCG's krcg-api v4 ("krcg v5" card JSON) is live now at `v4.api.krcg.org`; the unversioned `api.krcg.org` is due to switch to it, and — by the exact precedent of KRCG's earlier v2→v3 switch, which flipped this SAME unversioned `static.krcg.org/data/vtes.json` path and archived the old shape to a versioned one — the file Elysium actually fetches is expected to follow on its own schedule. `processCardData()`/`buildPrecons()` detect the shape **per card** via the v5-only `kind` field (`'Crypt'`/`'Library'`, absent from every v3 record) and branch to `parseV3Card()`/`parseV5Card()` (a card-list containing a mix of both, as in a cache-vs-fresh-fetch edge case, is handled fine — the branch is per-record, not per-file). Every other reader in the file (`cardTags()`, `krcgPath()`/`effPath()`, `clanSymUrl()`, the Deck Lab UI, `imgSyncCheck()`) reads only the normalized `meta`/`precons`/`catalog` output and needed **zero changes** — see "Printed vs chosen field" below for why that helper-normalizes / callers-don't-care shape is the reusable pattern here.

Field map (confirmed against two real `GET /card/{name}` v4 API responses — a library card and a crypt card — not guessed from the announcement prose):

| Concept | v3 | v5 | Notes |
|---|---|---|---|
| Card names | `card.name` / `card._name` / `card.printed_name` | `card.printed_name` + `card.name_variants[].name` (typed `Lexicographical`/`Vernacular`) | v5 has **no** `.name`/`._name` at all. `card.suffix` disambiguates same-name reprints (e.g. `printed_name:'Gratiano', suffix:'G2'` — the display name becomes `"Gratiano (G2)"`, matching its own `name_variants` entry). |
| Card text | `card.card_text` | `card.text` | Confirmed renamed, not restructured (the announcement's "replaces … card_text …" reads more drastic than what actually happened). |
| Capacity | `card.capacity` | `card.capacity` | Unchanged, crypt-only either way. |
| Disciplines (crypt) | `card.disciplines` (array; older discs as trigrams, newer as full names — see quirk below) | `card.disciplines` (array, **always** trigrams, upper = superior) | Same field name; v5 dropped the full-name inconsistency. |
| Disciplines (library req.) | folded into the same `card.disciplines` | `card.discipline_requirement:{type, disciplines}` | v5 splits "the card's own disciplines" (crypt) from "the discipline this card requires" (library) into different shapes. |
| Clan (crypt) | `card.clans` (array) | `card.clan` (single string) | v5: singular on crypt cards (a vampire has exactly one clan). |
| Clan (library req.) | folded into `card.clans` | `card.clan_requirement` (array) | v5: array, library-only ("requires a Toreador or Ventrue"). |
| Path | `card.path` (string or absent) | crypt: `card.path` (string, `''` when none); library: `card.path_requirement` (array) | `''` is falsy, same as v3's absent case — `krcgPath()`/`effPath()` needed no change. |
| Sect | `card.sect` (rare) + regex on `card_text` | not observed as a field on either sample — regex on `text` only | Was already regex-first in practice; v5 seems to drop the field entirely. |
| Sets/prints | `card.sets{setName:[{copies,precon,release_date,rarity}]}` + `card.scans{setName:url}` | `card.prints[{set:{id,code}, occurrences:[{type:'Rarity'|'Precon'|'Single', bundle, copies, date}], url}]` | Sets are now short **codes** (`V5`, `SV5`, `FoL`, `SoB`, `NB`/`NB2`/`NB3`, `PP3`, …), not full names — `isV5SetCode()` is the code-space sibling of `isV5Set()`. A precon is identified only as `set.code+':'+occurrence.bundle` (e.g. `"SW:PL"`) — **no human-readable precon name anywhere in the API.** Deck Lab shows the raw bundle code until/unless a code→name table gets built (tracked in `elysium-backlog.md`, not solved — several codes look like clan abbreviations but weren't confirmed enough to hardcode as fact). |
| Cost | `card.pool_cost` / `card.blood_cost` (strings) | `card.cost` (shape **unconfirmed** — both real samples had `cost:null`) | Read defensively (`parseV5Card` tries a `{type,amount}` shape and degrades to blank on anything else) — tracked in `elysium-backlog.md`. |
| Card images | not read from JSON at all | not read from JSON at all | Unaffected either way — Elysium builds `static.krcg.org/card/{name}.{fmt}` itself from the card name; a v5 card's image key is `norm(printed_name+suffix)`, verified to match the real filename (`gratianog2.jpg`). |
| Crypt group | not read | `card.group` (`"G1"`…`"G7"`) | Elysium has never read this field in either format — VTES's group-compatibility rule is left to the players, by design (sandbox, no rule enforcement). |

### Adding to the sync pipeline

`imgSyncCheck()` compares `cardImageNames` against `imgBlobCache`. If you add a new download category (e.g. token art), add it to `collectSvgNames()` or create a parallel set — never add non-primary card names to `cardImageNames`.

### Discipline index quirk (v3 only)

v3's `card.disciplines` has two formats: trigrams (`"dom"`, `"aus"`) for older disciplines, full names (`"oblivion"`) for newer ones. `cardTags(c)` indexes both forms; `DISC_NAMES` maps trigram → full name, `DISC_ABBR` maps full name → trigram. **v5 doesn't have this quirk** — its disciplines are trigrams throughout — but the dual-indexing in `cardTags()` was left as-is (harmless superset, and removing it would only save a few characters against the v3 branch still being live for cached data).

### Printed (KRCG) vs chosen (state) field — don't let a new KRCG field go half-wired

When a KRCG field represents something the player could *also* set manually in-game (v2.5.31: `card.path`, printed on some V5 Sabbat vampires but otherwise player-chosen via "Follow Path…"), don't write the KRCG value into the mutable per-card state field (`c.path`) — that conflates "printed, permanent" with "chosen, undo-able" and both `serializeGame`/`restoreGame` round-trip semantics start caring which one it is. Instead add a non-mutating computed helper that checks both:
```js
function krcgX(c){ const info=cardInfo && cardInfo.get(norm(c.name)); return (info && info.x)||null; }
function effX(c){ return c.x || krcgX(c); }   // chosen OR printed
```
Then **grep every reader of `c.x`** and switch it to `effX(c)` — detection functions, menu-population loops, badges/icons — not just the one call site a bug report points at. A menu-gating check and a detection function can silently drift apart when only one of them gets updated to read the new source.

---

## Skill: Parse a pasted deck-list text format (v2.5.89)

`parseDeck(text)` (a single line-by-line pass, no external dependencies) has to cope with several real export tools that all describe the same two things — a crypt section and a library section, each `{qty} {name}` per line — but disagree on nearly every cosmetic detail. Confirmed variants in the wild: VDB's "Text/TWD" format (`Crypt (N cards, min=X max=Y avg=Z)` or `Crypt(N cards, min=X, max=Y, avg=Z)` — space and comma placement both vary — followed by an underline of EITHER `=` or `-` or nothing at all, fixed-width columns for capacity/disciplines/clan on crypt lines, category sub-headers like `Master (10; 4 trifle)` inside the library section); Lackey CCG's export (tab-separated `{qty}\t{name}`, no `x` multiplier at all, LIBRARY FIRST with no header, then a bare `Crypt:` line); and some tournament software's flat export (`{qty}x{name}` with **no space** after the `x`, and **no `Crypt`/`Library` headers anywhere** — just a blank line between the two blocks).

**Don't chase every cosmetic variant with its own regex — identify what's actually load-bearing.** Section headers (`Crypt`/`Library`) only need `/^crypt\b/i`/`/^library\b/i` — `\b` (word boundary) already matches equally well whether the header is followed by a space, a `(`, or a `:`, so `Crypt(12 cards...)` and `Crypt (12 cards...)` and `Crypt:` all set the mode identically with zero extra cases. Underlines (`===`/`---`) and category sub-headers (`Master (10; 4 trifle)`, `Action (8)`) never start with a digit, so the card-line regex already ignores them for free — don't special-case them.

**The two genuine format axes, both worth a real fix:**
1. **Optional whitespace after the multiplier.** `(?:x\s+)?` (require whitespace after `x`) silently mis-parses `3xAmavi` as qty `3`, name `"xAmavi"` — the stray `x` gets swallowed into the name capture instead of recognised as the separator, because the optional group fails to match (no whitespace to satisfy `\s+`) and backs off entirely. Fix: `(?:x\s*)?` (zero-or-more). Verify with a real failing example before and after — don't just reason about the regex on paper.
2. **No section headers at all.** When `mode` is still `null` (no `Crypt`/`Library` line has appeared), don't default a card line to library right away — stash it (`{qty, name, afterBlank}`, tracking whether a blank line preceded it) and resolve the whole batch after the full pass: **card-database lookup first** (`cardTypes.get(norm(name))` — the same lookup `isMinion()` already does — Vampire/Imbued → crypt, else → library; authoritative, works regardless of layout or blank lines), **falling back to position** (everything before the first blank-line gap is crypt, the rest is library) when the name isn't in the loaded database, and **falling back to library** (this function's own prior default) when there's neither a database entry nor any blank-line gap at all — which is also exactly correct for Lackey's library-first layout, since those entries have no gap before them either.
3. **Order of the two fallback layers matters and is testable independently of real files:** construct a case where position and card-type would disagree (a library card placed before the gap, a crypt card placed after it) with a small `processCardData()` fixture supplying the types — if the database wins, the layering is right.

**Cross-validate with real multi-format examples of the SAME deck** when they exist (a tournament's TWD export, its bare-list export, and its Lackey export, e.g., all describing one real submitted decklist) — parsing all three to the identical crypt/library card multiset is a much stronger proof than three separate unit tests that never check each other.

---

## Skill: Dock (`.l2dockopen`) proportional scaling — keep sibling zones in ratio as the window grows

The bottom dock (`#z-crypt`/`#z-library`/`#z-ash`/`#z-pool`/`#z-hand`/`#dockLog`) sits in a row and must grow with the window without any element hogging all the extra space or the row overflowing off-screen (v2.5.27, v2.5.33).

### The trap

Scaling *some* siblings by `--dock-s` (piles, pool) while leaving another **fixed px** (v2.5.27's original Hand: `width:440px`) and letting a third **fill whatever's left** (Log, via `left:calc(...)` + `right:10px`, capped by `max-width`) guarantees 100% of any extra width lands on the filler. Nothing is individually "wrong" — each rule is locally reasonable — but the fixed sibling never grows and the filler absorbs everything, breaking the ratio that looked right at the design size.

### The fix pattern (`updateDockScale()`)

1. Give every sibling that should hold a ratio **the same scale factor** (here, `dockS`) — `handW=440*dockS, logW=520*dockS` (the ratio at `dockS=1`, the laptop-calibrated size).
2. Measure the board's **real remaining width** (not a height-derived proxy like `dockS` alone) for that group: `avail = W - leading - trailing`, where `leading`/`trailing` are the other dock elements' actual current offsets (also `dockS`-scaled where they are).
3. If the scaled siblings' combined width would exceed `avail`, scale **both down together** by the same factor `k=avail/total` — ratio preserved, overflow impossible, no-op at the size where they already fit.
4. Write results to new `:root` custom properties set via JS (`--dock-hand-w`, `--dock-log-w`), same pattern as `--dock-s` itself — **not a class rule**, since `position:absolute` descendants across stacking contexts don't reliably see vars set that way.
5. In CSS, swap the old fixed/max-width declarations for the new vars. An element with `left`+`right` both set can also take an explicit `width` — per spec, `right` is simply ignored once `left`+`width` are both present, so no conflict.

### Rule of thumb

If two-or-more dock/layout siblings need to hold a visual ratio under scaling: scale them all by the same factor, then clamp the *group* against a real measured bound — never "some scale, one fixed, one fills the rest."

When a card element (not a ghost) is dragged from the open dock onto the board in L3 or L4, five interlocking mechanisms must all be correct or the card will appear to jump or land at the wrong position.

### The five components

#### 1. `wasLifted` flag — corrects for `.handhover` CSS translate at pointerdown

`.handhover` adds `translate: 0 -26px` (card lifts visually). A **capture-phase** `pointerdown` listener on `#board` removes `.handhover` BEFORE `bindCard`'s bubbling handler runs, so the class is already gone when grab offset is computed. The capture listener sets `el.dataset.wasLifted = '1'` to preserve this fact.

In `bindCard`'s `pointerdown`:
```js
const wasLifted = c.el.dataset.wasLifted === '1';
delete c.el.dataset.wasLifted;
if (c.el.classList.contains('handhover') || wasLifted) drag.oy += 26;
```
This adds 26 board-px to the grab offset, counteracting the -26px the user's cursor was on when they clicked the lifted card.

#### 2. `el.style.translate = 'none'` — clears frozen CSS translate at drag start

When `.handhover` is removed, the CSS `translate` starts **transitioning** from -26px → 0 (`.card` has `transition: translate .14s ease-out`). When `el.classList.add('dragging')` fires in the first `pointermove` (`transition:none`), this transition **freezes mid-way** (e.g. at -13px). The card is now 13px above its transform position. `drag.oy` was computed based on transforms, so the cursor appears wrong.

**Fix**: immediately after `el.classList.add('dragging')`:
```js
el.style.translate = 'none';   // clear frozen residual translate; instant with transition:none active
```

#### 3. 50% centre-pin — replaces `regrabAtScale` for dock exits

`regrabAtScale` preserves grab fraction (e.g. 70% of 118px card = 82px → 70% of 24px scaled card = 17px = near bottom). At small L4 scales this makes the cursor visually drift to the card bottom.

For L3 (inside `if(!drag.moved)` dock-exit block):
```js
const s = (l2pub.on ? l2pub.s : 1);
drag.ox = s * CW * 0.5;
drag.oy = s * CH * 0.5;   // cursor always at card centre through drag and placement
```

For L4 (inside `if(drag.l4DockDefer && yd < H*0.66)` block):
```js
const bs = (l2pub.on ? l2pub.s : 1) * L4_CARD_S;
drag.ox = bs * CW * 0.5;
drag.oy = bs * CH * 0.5;
```

These are set AFTER `setCenterFrameA` has run so `l2pub.s` is current.

#### 4. Guard against `.handhover` re-addition during drag

The board's `pointerover` listener adds `.handhover` to hand cards. During L4 dock-defer (dock still open), the condition triggers and re-adds it to the dragging card. Pointer capture prevents `pointerout` from removing it. This causes a 26px visual lift during drag, removed by `place()` at drop = 26px "card drops" illusion.

**Fix**: add `!el.classList.contains('dragging')` to the pointerover condition:
```js
if (c && c.zone === 'hand' && !el.classList.contains('dragging') && !(l3on() && !l3handOpen && !board.classList.contains('l2dockopen'))) {
  el.classList.add('handhover');
```

#### 5. `async pointerup` — `.dragging` removed AFTER `place()` runs

The `pointerup` handler previously removed `.dragging` (which has `transition:none`) synchronously BEFORE calling `dropCard()`. Since `dropCard` is `async` (hits `await masterPlayGate`), this meant `place()` ran with transitions ACTIVE. The box-shadow transition (`0 16px 30px → 0 2px 6px`) created a perceptual "card sinks 14-16px" landing illusion.

**Fix**: make `pointerup` async and move the class removal to after `await dropCard`:
```js
el.addEventListener('pointerup', async e => {
  if (!drag || drag.c !== c) return;
  // group members still get .dragging removed immediately (they're already positioned)
  if (drag.group) drag.group.forEach(m => m.c.el.classList.remove('dragging'));
  const d = drag; drag = null;
  if (!d.moved) { el.classList.remove('dragging'); tap(c, d); return; }
  if (c.zone === 'hand' && !d.group) {
    const surf = opponentSurfaceAt(e.clientX, e.clientY);
    if (surf && surf.seat !== mySeat()) { el.classList.remove('dragging'); giveTo(...); layout(); return; }
  }
  await dropCard(c, d);          // place() runs inside with transition:none still active
  el.classList.remove('dragging');  // NOW restore transitions — only shadow fades, transform already final
});
```

### Ghost card pile drags (Crypt / Library)

Pile drags use a ghost element (not the real card). The ghost transform positions it relative to the cursor. **Use `translate(-50%,-50%)` not `translate(-50%,-60%)`.**

The `-Y%` percentage is relative to the element's **CSS box** (CW×CH), not the visual scaled size. The cursor's position fraction = `|Y%|/100/_s + 0.5`, where `_s` is the display scale. With `-60%`: at _s=0.2, fraction = 0.6/0.2 + 0.5 ≈ 3.5 → cursor far below ghost. With `-50%`: fraction = 0.5/_s + 0.5... wait, actually with the compose of `translate(-50%,-50%) scale(_s)` around transform-origin center:

Visual top = `cursor_y - _s*CH/2`. Cursor at 50% of visual height. This matches the drop calc `by = (cursor_y - br.top)*f - CH*_s/2`.

### Verification checklist for dock drag changes

After any change to dock-drag logic:
1. Syntax check + `node test-client-logic.js` (16/16)
2. Live test: hover a hand card → grab it in the middle → drag to board → card should centre on cursor and land there
3. Live test: drag crypt/library ghost → card should land centred on cursor at release
4. Check both L3 (structured) and L4 (classic) views
5. Check re-entering dock (cursor back below threshold) — card should scale back up and dock should reopen

---

## Skill: Integrate a dock drag with the dock lifecycle

When adding a new drag mechanism that starts inside the dock (like pile drags for crypt/library), it must participate in the full dock open/close cycle.

### Steps

1. **Close on drag start** — when the drag's `started` flag becomes true (after the 5px threshold), call `setL2Dock(false)`. This clears the board for drop targets.

2. **Set visual scale AFTER dock close** — `setL2Dock(false)` triggers `layout()` → `setCenterFrameA()` → `l2pub` update. Any ghost/card scale must be computed after this, using `l2pub.s * (l4on()?L4_CARD_S:1)`.

3. **Reopen on hover** — in the drag's `onMove` handler, check cursor Y:
   ```js
   const br=board.getBoundingClientRect(), f=board.clientWidth/br.width, yd=(e.clientY-br.top)*f, H=board.clientHeight||616;
   if(!board.classList.contains('l2dockopen') && yd >= H-36) setL2Dock(true, true);
   else if(board.classList.contains('l2dockopen') && yd < H*0.66) setL2Dock(false);
   ```

4. **Dock-area guard in target function** — the target function (e.g. `cryptDragTarget`) must return `'cancel'` when the dock is open and the cursor is in the dock overlay area (≥66% height). Otherwise, zones hidden underneath the dock (like `#z-uncontrolled`) produce false hits. Check the dock guard **after** any valid dock-zone checks (e.g. `#z-hand` for library drags) but **before** board-zone checks.

5. **L4: check L4 before zone hit-testing** — in L4, the board is free-placement. Zone elements retain valid bounding rects despite being invisible. Early-return `'ready'` for any board position in L4 before checking specific zones.

6. **Use scaled card dimensions for drop position** — the `onUp` handler computes drop position as `cursor - halfCardWidth`. Use `_s = l2pub.on ? l2pub.s*(l4on()?L4_CARD_S:1) : 1` for both the offset (`CW*_s/2`) and clamping bounds (`CW*_s`).

### Why separate from card drag

Pile-zone cards are `.inert` in the dock — the regular card drag `pointerdown` handler returns early for them. The card drag's dock-close logic (in the first-motion block) never fires for pile cards. Each pile drag IIFE needs its own independent dock lifecycle.

---

## Skill: Tune the L3 helicopter layout

The L3 layout has many interacting parameters. Iterative pixel-level tuning with live visual feedback converges faster than algebraic optimisation.

### Key parameters (5-player pentagon)

| Parameter | Current | What it controls |
|-----------|---------|------------------|
| `Bw3 + N` | +50 | Board width expansion beyond the 3-band base limit |
| `yM offset` | +15 | Prey/pred vertical shift below even distribution |
| `dockShift` | `Bh*0.02+16` | Bottom board lift for dock clearance |
| `clockCy` | `cy` | Timer/Edge vertical position (decoupled from prey/pred) |
| `mX/mY` | 0.5% | Table-edge margins |
| `gx` | 0.8% | Column gap |
| `PAD` | 2 (L3) / 12 (L2/L4) | Zone border padding within each slot |
| `flip` | true for top-row | Zone inversion (Ready faces down) |

### Tuning workflow

1. Start with the current values. Load a 5-player hotseat game in L3.
2. Adjust one parameter at a time (e.g. `Bw3 + 50` → `Bw3 + 55`).
3. Syntax check + deliver → Johan tests live.
4. Iterate based on visual feedback. Always offer revert.

### Key insight

The rigid 3-band vertical limit (`A.ah/3/AR`) is suboptimal for odd player counts because prey/pred sit on the flanks and don't horizontally conflict with centred boards. The +50px expansion fills pentagonal gaps safely. The horizontal limits (`A.aw/2`) provide the real ceiling.

---

## Skill: Update the living documents

After every implementation, update all three docs:

### `elysium-project-context.md`

- Bump the version in the header
- Update any changed architecture descriptions
- Add/update function references if new key functions were created
- Update the `conv` table if a setting was added/changed
- Update the file table if a file was added

### `elysium-learnings.md`

- Bump the version in the header
- Add a new version section with learnings from this implementation
- Focus on: things that broke, things that almost broke, patterns that should be reused, pitfalls to avoid

### `elysium-session-journal.md`

- Add a session entry documenting: what was built, design decisions made, any trade-offs or alternatives considered
- Include "Verifierat: syntaxrent, N/N klienttester" status
- Note what awaits live testing

### Delivery

All three docs should be delivered alongside the code changes in the same `present_files` call.


---

## Skill: Reconcile a rebuild-style renderer (the A3b pattern, v2.5.36)

Turn a teardown-and-rebuild renderer (`host.innerHTML=''` + rebuild) into a keyed reconcile so persisted elements ride their CSS transitions (position/rotation glide) and can play keyframe animations on state changes. Applied to `renderL4OppCards()` + `addRCard()` (v2.5.36), then lifted to `buildMat`/`renderRemote`/`renderFull`/`renderL3` in **v2.5.38** via `buildMat`'s new `host` param. The one remaining rebuild surface is the L2 prey/predator peek panes (the pane is born fresh in `buildL2mat`; a ~10-line caller change now that `host` exists).

**The same principle, minus the machinery, for a single non-list element (v2.5.88):** `updateL4GlobeHTML()` isn't a list-of-cards renderer, so it doesn't need keying/mark-and-sweep — but it had the exact same root disease: every update did `glob.el.innerHTML=...`, silently discarding the pool ± buttons' `bindHold` listener (attached once, in `createL4Globe()`, right after the FIRST call to this function). Fix pattern for this simpler case: `if(!glob.el.firstChild)` distinguishes "first build" (full innerHTML, safe — nothing to lose yet, and the caller attaches listeners immediately after) from "update" (touch only the sub-elements that can change — text content, a style property, an icon `<img>` swapped via the same remove-then-append pattern `refreshClanDisplay()` already uses for `#pool`/`#dockPool` — and never re-touch the buttons at all). **The tell that this bug class is present: any element created once at setup time with its own listener, sitting inside a container that some OTHER function later rebuilds via innerHTML for an unrelated reason** (here: the clan icon changing rebuilt the whole globe, including buttons that had nothing to do with clans).

**v2.5.38 application notes (the mat variant of the recipe):**
- **Furniture-strip, not wipe:** on reuse, remove every mat child that is NOT `.card` / `.mattok` / `.matlab` — zone boxes, labels and the pool globe are cheap to rebuild each pass; the reconcilable elements persist.
- **The label updates in place** (`.matlab` innerHTML each pass); `noLabel` removes it; the mat click-listener binds on `freshMat` only.
- **Two stamp namespaces:** cards/tokens use the per-mat `_rcpass` (swept inside `buildMat`); the CALLER sweeps departed seats' whole mats with its own `_matpass` on the stage/host — never share one counter for both levels.
- **`!pub && !freshMat` purge:** a seat that goes vacant must drop the previous occupant's persisted cards explicitly, since the pub branch (where the sweep lives) never runs.
- **Keyed singletons reuse-or-create:** `#l3table`/`#l3timer` (and any per-view furniture with an id) get `let x=$('#id'); if(!x){create+append}` + unconditional property updates — never unconditional createElement.
- **Mode-tag mixed hosts:** `#rvCards` renders EITHER a mat or the L1 inspector — stamp `host.dataset.rvMode` and wipe clean on a mode switch; selective-strip only within the same mode.
- **Token size cache:** store `_tsz` and re-render the SVG only when the scale changed; position updates ride an inline left/top transition (the `.l3panning .mattok` guard already suppresses it during drag-pan).

1. **Key = seat+cid, looked up in the HOST.** `host.querySelector('.card.rc[data-cid="..."][data-seat="..."]')`. Card ids are per-client mints, so seat A's c17 and seat B's c17 can collide -- never key on cid alone. Because the lookup is host-scoped, callers that wipe first (buildMat/renderFull) never match -> the fresh path IS their old behaviour; only non-wiping callers opt in.
2. **Builder becomes create-or-update.** Skeleton `innerHTML` + one-time listeners in the `fresh` branch only; EVERYTHING else (classes, face content, badges, counters, transform/z, rings, tags) runs on both paths and must be idempotent. Return the element.
3. **Once-attached listeners must read LIVE data.** A closure over the build-time card object goes stale on reuse (wrong faceDown/name/owner in menus after a flip). Stamp `el._rc=c; el._ctx=ctx` EVERY render; handlers read `el._rc`/`el._ctx`, never their creation closure.
4. **Class reset needs survivors.** `el.className='card ...'` wipes state classes; capture and re-add `anim-*` (a mid-flight flip) and `noimg` (the art-failed marker) first.
5. **Attach error-fallbacks at creation, unconditionally.** The front-img webp->jpg fallback was attached only when built face-up -- a reuse-REVEAL sets src later and still needs it.
6. **Keyframe pulses need a reflow to restart on a persisted element.** Remove class -> `void el.offsetWidth` -> re-add (`rcnew`/`rcchg`).
7. **Detect the flip from the ELEMENT's previous state**, not the fx diff: `wasDown=el.classList.contains('down')` before the class reset; `wasDown!==!!c.faceDown` -> `animCardEl(el, flip...)`. The fx `chg` set also fires on blood changes -- too coarse. Entrance: `fresh && fx.neu.has(id)` -> `'rise'` (neu gates it to true pub-newcomers, so wiping callers don't rain rise-anims on every render).
8. **Mark-and-sweep removal.** `wrap._stamp++` per pass; stamp every touched element (`addRCard(...)._stamp=stamp`); afterwards remove children whose stamp differs. Covers departed cards AND vanished tokens in one sweep.
9. **Respect the animation settings at the remote call site**: `animMode!=='all'` (mirrors cardFx's remote rule -- "Mine hidden" still shows others').
10. **Audit every per-frame re-render path for transition lag.** In L4, `applyL3Transform()` -> `layout()` -> the renderer runs on EVERY pan/zoom frame. Drag-pan is guarded (`.l3panning .card{transition:none}` -- add a sibling rule for any NEW transitioned element class, e.g. `.l3panning .mattok`); zoom-glide is fine because own cards already glide on zoom re-place -- reconciled elements now match them (parity, not a regression).


## Skill: Geometry harness (L3/L4 slot math)

When a layout bug involves `l3slots`/`l3geom` (or any pure-ish geometry function), don't reason from read code — **run it**:

1. **Slice the live functions** with a brace-counting cut (`src.indexOf('function NAME(')` + depth walk) — never transcribe; the harness must execute the same bytes that ship.
2. **Stub the globals** the slice touches (`board:{clientWidth,clientHeight}`, `l3canonAR`, `L2GEO`, `effectiveL3Shape:()=>'square'`, `asideCollapsed`, `Math`) and eval via `new Function(...keys, 'return eval(...)')`.
3. **Check invariants programmatically**: pairwise rect intersection with a 0.5 px epsilon, felt-bounds containment, and the specific margin under suspicion (e.g. `me.x-(prey.x+prey.w)`) — print px numbers, not verdicts.
4. **Sweep the input space**: sizes laptop→4K, `canonAR` set vs 0, AR fine-sweep to locate the critical boundary. The user's pinpoint ("X overlaps Y, others fine") tells you WHICH margin to sweep.
5. **Verify the fix in situ**: apply the candidate edit TEXTUALLY to the slice (`code.replace(OLD,NEW)` with an anchor assert) and re-run the sweep — then, post-patch, re-run the harness against the patched file itself. The reference config must come out numerically identical (`Bw 357.015 -> 357.015`).
6. **Scale-invariance claims get the similarity assert** (v2.5.45): hold canonAR constant, sweep s, and assert `slot(s·window)/s ≡ slot(reference)` per coordinate (<0.1 px tolerance for integer-rounded windows). Run OLD-vs-NEW at the reference too (calibration identity). Any px constant in the solver fails this loudly — convert it to a fraction with the calibration division in the comment, and recalibrate `max(floor, fraction)` clamps so floor==fraction AT the reference.

## Skill: Undo coverage audit (snapshot vs mutations)

When undo correctness is questioned, don't spot-check - diff the whole surface:

1. **Read the doctrine first** (learnings/journal): which fields are DELIBERATELY excluded (`openHand`, `selected`, `turnLogs`, monotonic `seq`/`topZ`) and why - "two serializers, two scopes".
2. **Extract capture lists programmatically**: parse `(\w+):c\.` and `(\w+):state\.` out of `snapshot()`'s source; remember spreads (`counters:[...c.counters]`) evade the regex - reconcile by eye.
3. **Grep all mutations**: `c.X=` / `state.X=` codebase-wide (push/splice-mutated arrays won't show - list zones/attached/counters manually), subtract known runtime/render-cache fields (`el`, `tx/ty/lx/ly/zc/cs/rot`, gesture flags).
4. **Cross-reference `serializeGame`**: a field in the save blob but absent from the snapshot is either doctrine or a bug - decide WITH the doctrine list, and check restore-function PAIRS mirror each other's side effects (restoreGame's Edge-token sync vs restoreSnap).
5. **Verify the sync chain**: undo must reach opponents + the autosave - in Elysium that rides `log()` -> `scheduleSave()` -> `schedulePush()`, so every mutating path must log (non-private) or call scheduleSave.
6. **In-situ check after the fix**: assert each new field name appears in BOTH function bodies, and that the doctrine exclusions still do NOT.

## Skill: Relocating a calibrated-geometry HUD element to chrome/panel

When a felt/board element only fits some configurations (a calibrated centre hole, a specific player count, etc.) and needs an alternate home for the rest:

1. **Check mode-check exclusivity first.** grep every `classList.add(...)` for the modes involved - a "helper" mode (like L4) may silently carry the SAME class your gate checks (`l3on()` true in L4), meaning shared code runs there too even though it looks mode-specific by name.
2. **New gating flag defaults to preserving CURRENT behaviour**, set explicitly only by the ONE function with the deciding knowledge (here: `renderL3()` knows N). Every OTHER function that shares the gated code gets a defensive reset at its own top - don't rely on "it should still be fine."
3. **Wrap the existing calibrated code unchanged** inside `if(<flag>){ ...untouched... }` rather than threading the new condition through its lines - keeps the reference configuration provably byte-identical.
4. **Persistent elements need explicit un-hide on mode exit**; elements the exit function already destroys don't. Check what the mode's teardown function (`clearL3`-style) currently removes vs merely styles-resets.
5. **Relocated info panels are siblings OUTSIDE any full-rewrite region** (`renderStats()`-style `innerHTML=...` blocks) with their OWN update function, sharing string-building helpers with the original via extraction, never duplication.
6. **Grep tutorial/coachmark arrays for hardcoded `target:()=>$('#id')`** pointing at anything the relocation might hide - add a visibility fallback.
7. **Before shipping any `el.hidden=...` toggle, grep whether that element's OWN CSS sets `display`.** If it does (`#id{display:flex}` etc.), the browser's `[hidden]{display:none}` default silently loses the cascade and the toggle does nothing visually - add `#id[hidden]{display:none}` in the SAME patch (precedent: `#helpOverlay[hidden]`, `.tok[hidden]`, `.set-row[hidden]`, `#hoverCard .htok[hidden]`).

## Skill: Auditing a CSS-transition race

When a measurement might race an animated layout change ("toggle away and back fixes it" is the fingerprint):

1. **Find the two clocks**: the synchronous flag flip and the transition duration (`grep transition:` on layout-affecting properties - width/height/flex; ignore color/opacity/shadow). If only one container transitions (here: `aside` width, 140 ms), the class is bounded to that toggle's call sites.
2. **Grep every call site of the toggle** and inspect what runs synchronously after each: no measurement -> safe; measurement feeding a **live-derived** render -> self-healing transient (verify a settle mechanism exists: rAF/timeout re-dispatch + resize listeners); measurement **captured into persistent state** with guarded/no recapture -> the real bug.
3. **Fix by reordering, not by waiting**: measure BEFORE the toggle so value+flag form one consistent snapshot (works for every prior state by construction) - never add timeouts matched to the transition duration.
4. **Check dispatch-vs-flag ordering in any settle mechanism** (`dispatchEvent` is synchronous - a guard cleared after the dispatch is still up during the handlers) and document whether that is intentional doctrine before touching it.

## Skill: Reordering elements in a shared-budget flex row

When N absolute-positioned siblings sit on one coordinate baseline and moving one to a new spot is requested:

1. **Check whether any pair shares a computed FLEXIBLE width** (search the sizing function for "remaining space" / "avail" style budget splits) before touching CSS. If two elements split leftover space between them, moving one away from the other is still safe — see step 2 — but you need to know this BEFORE promising a "simple" reorder.
2. **Prove the budget math is order-independent**: if the flexible budget is computed as `total - sum(fixed widths)`, that sum is commutative — it doesn't matter which physical order the fixed elements sit in. This means the WIDTH-COMPUTING function needs zero code changes, only comment corrections.
3. **Reorder via a shared-prefix insertion, not N recomputations**: give the new-first element the OLD baseline (`left:1.6%`-style), and prepend `newFirstElementWidth + gap` to every other element's EXISTING formula — their relative offsets from each other stay untouched.
4. **Verify with a numeric harness**: compute all slot positions under old vs new formulas at 2-3 representative scale points (calibration point, and both ends of any clamp range), assert identical total row width + zero overlap + correct order. Cheap insurance, matches this project's geometry-proof convention.

## Skill: transform-origin anchor choice (the pseat lesson)

When positioning a scaled element against an alignment spec:

1. **Identify which EDGE the spec references** ("left edge aligns with X", "centre stays on Y", "right edge hugs Z").
2. **Make that edge the `transform-origin`** (`0 0` for left/top, `50% 50%` for centre, `100% 0` for right/top). The referenced edge then equals the raw `left`/`top` style value at EVERY scale — drift impossible by construction, no compensation terms needed.
3. **Only if the origin CANNOT be changed** (e.g. it's load-bearing for other math) do you add compensation: scaled gap terms for offsets tuned at a reference scale, plus `±naturalSize×(s−1)`-class terms for non-origin edges — and remember `offsetWidth` ignores CSS transforms, so it measures the natural size correctly even post-scale.
4. **Classify both sides of a wrapper boundary as literal-on-screen or scaling-on-screen before aligning across it** — a `k/scale` offset inside a `scale()` wrapper is LITERAL on screen (the codebase marks these "offset stays literal"), so matching it from outside takes a literal constant, not a scaled one.

## Skill: merging parallel branches (the v2.5.72 playbook)

1. **Verify the fork topologically first**: pre-fork markers present in BOTH files; each branch's post-fork markers absent in the other. Cheap, and it proves no work was lost before anything moves.
2. **Pick the base = the branch with surgical rewires; transplant the branch with additive features** by slice extraction, using its JOURNAL as the merge map (exact functions, sites, counts).
3. **Wholesale-replace functions only one branch touched; hand-merge the rest.** Before "restructuring" anything, check whether the structure already exists (updateBadges was pre-fork — the journal described USE, not creation).
4. **Conflicts resolve by principle**: duplicates → keep the base's; infrastructure×calibration → express the proven values in the new table and PROVE equivalence numerically; later design decisions govern parallel features (flag for veto).
5. **Assert-abort + write-after-loop is the safety net** — it saved this merge twice. And assert in the unit you measured: bytes ≠ chars in UTF-8.
6. **Finish with a combined checklist built from BOTH branches' fix lists + every suite + the transplanted branch's own harnesses run against the MERGED file.**

---

## Add a field to the public board (buildPub → sanitizePub → renderers)

The v2.5.73 lesson: the pub pipeline has THREE stations and the middle one is easy to forget because hotseat skips it.

1. **`buildPub()`** (client) — add the field, `undefined` when empty so it costs nothing on the wire.
2. **`sanitizePub()`** (server, `elysium-server.js`) — add a whitelist line WITH sanitization in the SAME patch: `cleanCard` for strings, regex-gate enums/slugs, `Math.round`+clamp numbers, cap array lengths. Skip this and the feature works in hotseat (pubs go straight into `net.boards`) and silently dies online. Bump the server VERSION (behaviour change) — restart required.
3. **Receive-side consumers** — every renderer that should show it: `buildMat` (L3 mats + visit), `renderL4OppCards`/`updateL4Opponents` (Classic — the historically forgotten pair, see the L4-drift learnings), `renderFull` (L1 visit inspector), plus `_syncRB`/`updateBadges` if it's a card badge.
4. **Verify like v2.5.73 did:** brace-walk the patched `sanitizePub` out of the server file and run it in Node against a representative pub (valid + junk entries) — assert the field survives, junk dies, and hand cards still never relay. Then `elysiumPubPreview()` in the console shows the sender side, and a two-client live test closes the loop.
5. **Docs:** the protocol doc's §5 prose lists the intended pub surface — keep it truthful; §7/§8 field tables are about MESSAGE fields (`t`, `seat`, `pub`), not pub internals, so the lint stays green without edits.
6. **Open this recipe before designing** (v2.6.149, `tn`/`rn`): the turn count was designed client-only, passed the harness (it feeds pubs straight into the handler) and failed only in the real-server reload run, because station 2 drops what it does not name. A field that must survive a reload also needs the owner's copy: `sanitizePub(pub, true)` builds `pubOwn`, which `joined.myPub` hands back.


## Add or extend an fx clone (cardFx → server fx relay → receive → captions)
The fx pipeline is COSMETIC (no state trusts it) but has the same whitelist-drift trap as buildPub→sanitizePub. Touch-points, in order:
1. **`cardFx(c, kind, opts)`** (client) — the broadcast branch mpSends `{t:'fx', kind, card, target, actor, onto, verb, reveal, toName}` and calls `pushNow()` (the clone and the board travel together — v2.5.73 doctrine). New opts must join this literal.
2. **Server `fx` handler** — TWO allowlists in one function: the kind ENUM (`lock|unlock|play|flip|rise`) and the relayed FIELD set. A new kind or field must be added here in the SAME patch, sanitized (`fxCard` for card-shaped fields, `cleanName`+slice for strings, tri-state booleans preserved — `reveal` distinguishes true/false/undefined). Bump the server VERSION — restart required.
3. **Receive:** the client `fx(m)` handler passes everything through to `cardFx(..., {remote:true, ...})` — extend its opts pickup if the field is new.
4. **Captions/render** inside cardFx — remote payloads may carry blanked names (fxCardInfo privacy); the conceal-flip name exception is the ONE sanctioned relaxation (documented at both sites, v2.5.74).
5. **Protocol doc** §7 (c2s accepted fields) + §8 (s2c fields) rows for `fx` — the doc is the contract (twice it was ahead of the server); the lint guards the verb indexes.
6. **Verify like v2.5.74:** brace-walk the patched handler + `fxCard` + `cleanName` out of the live server file, run a message matrix in Node (valid kinds, junk kinds, privacy invariants, tri-state reveal), then a two-client live test.

## Add a dock auto-close gate, a pin-to-stay-open toggle, or a chrome quick-button (the v2.5.75 pattern)
1. **New auto-closer of the dock?** Gate it on `!dockPinned` — the pin's contract is that every EXECUTED `setL2Dock(false)` is legitimate; the release lives centrally in setL2Dock's close branch. The five existing gated sites: pile-drag start (×2), pile leave-close (×2 sites, one line each), hover hysteresis (board + rview twins), touch felt tap, L4 defer-exit's close/hide branch.
2. **New drag interaction with the dock?** Respect `conv.dockDrag`: 'leave' means no closing at gesture start (the per-move 66%-line rule closes), 'close' means collapse at start — for stateful gestures use a one-shot flag on the gesture object (the `drag.dockCloseNow` pattern) so later deliberate re-entries aren't fought.
3. **New chrome chip on the dock's top edge?** Copy the `#l2dockClose` CSS family (top:-15px, 64×26, border-bottom:none, radius 9 9 0 0), add the id to the marquee-exclusion `closest()` list (line ~2843), and mind touchui side-by-side offsets if a sibling chip exists.
3b. **New "pin this open" toggle on a large existing surface (not a small chip)?** The dock pin ended up here after two chip iterations felt visually wrong: bind the click directly to the EXISTING background element (`#l2dockbg`) rather than adding a new floating chip, guarded by `e.target===theElement` (not `closest()`) so bubbled clicks from children don't mis-fire. Add that element's id to the marquee-exclusion list too — an element with no prior click meaning is easy to forget there, and an unexcluded click will both fire your handler AND spawn a selection-clearing zero-size marquee. For the "pinned" visual, prefer `box-shadow` over changing a property the element's base CSS already sets (like `border-color`) — a base rule scoped to two ID selectors (`#board`+`#target`) will usually out-specificity a simple `.pinned{...}` class variant; box-shadow is typically untouched by the base rule, so the specificity fight never happens.
4. **New top-menu quick-button?** One `<button class="btn" id="...">` beside its siblings + a handler that RIDES an existing send path (the ❗ button is one line: `saySend(0)` — guard/relay/SFX/tutorial breadcrumbs come free). Add a row in the shortcuts help list; if the tutorial teaches the slow path, add a follow-up step showing the shortcut (gate on the same breadcrumb the slow path sets).

## Audit an `l3on()`/`l4on()` sibling gap after fixing one side (the v2.5.76 pattern)
`l3on()` returns true DURING L4 too (`board.classList` carries both), so an `if(l4on()){…} else {…}` inside an `if(l3on()){…}` block is a common shape for "L4-specific behaviour, L3 gets the plain/default path." When a fix ships for the L4 branch (e.g. v2.5.75's `l4DockDefer` defer-until-leaves mechanic), **always check whether the `else` (real L3) branch has the identical gap** — it's easy for a bug report about "L4 does X wrong" to get a scoped fix that never touches the sibling doing the SAME gesture with the SAME symptom class. The generalizable move (done here): promote the fix from `if(l4on())` to `if(l3on())`, keep the L4-only multiplier (`L4_CARD_S`) as an inline `(l4on()?X:1)` term instead of a branch split, and delete any now-redundant partial handling the old `else` branch had (here: a reopen line that never rescaled — the unified block does both correctly).

## Diagnose a "looks fine everywhere except one place" CSS symptom
Before writing a one-off override for the ONE broken call site, check what ELSE differs about that site's ambient styling — most often the ambient `font-size` feeding an `em`/`rem` value on a shared class. Concretely: grep every class the element carries (not just the one you expect), because a shared component can carry TWO classes that both set the same property (`.clansym{margin-right:0.18em}` + `.clanbadge img{margin-left:2px}` on the identical `<img>`) — the browser applies both (higher-specificity rule wins per PROPERTY, not per rule, so an unset property like `margin-right` on the winning rule still lets the other rule's value through). Inside a centering flex/grid parent, asymmetric margins shift the item off-centre by half the difference, and an EM-based margin scales with whatever ambient font-size the DOM position inherits — small and invisible in a compact list row, glaring in a large-type caption. Fix at the ROOT (explicit margin shorthand zeroing every side the intended rule doesn't own) rather than nudging the one call site — that keeps future call sites at ANY ambient font-size safe by construction.

## Audit a derived `state.X` cache for missing recompute triggers (the v2.5.82 clan-icon pattern)
When a value is EXPENSIVE-ish to recompute on every render (e.g. iterating `state.zones.ready` for majority clan/path) and is instead cached in `state.X`, refreshed only by explicit `updateX()` calls at specific mutation sites, a bug report shaped like **"X was wrong, then an unrelated action fixed it"** is the fingerprint of a missing trigger, not a wrong computation. Diagnose and fix it the RIGHT way round:
1. **Find the recompute function** (here `updateMyClan()`) and grep every one of its call sites — note what USER ACTION each one sits inside (a zone move, playing a card, …).
2. **Grep every assignment to the field(s) the cache actually depends on** (here every `c.faceDown=` in the file), not just the sites you already suspect. Cross-reference against step 1's list — any mutation site NOT covered is a gap, even if it "feels like" the same action as a covered one (a flip toggling `faceDown` in place is conceptually adjacent to a zone move, but is a genuinely separate code path).
3. **Check bulk-mutation paths separately** — undo (`restoreSnap`) and any full-reset function (`resetForDeal`, `clearTable`) mutate the same fields in bulk, outside every per-gesture call site found in step 2, and need their own explicit recompute call (placed next to whatever OTHER "restored/reset but never redrawn" fixes already exist there — see v2.5.46's `renderPhaseCounts()` for the established pattern).
4. **Verify the mechanism in isolation** (extract the recompute function + its dependencies with a Node harness, seed the exact reported scenario, assert the cache is wrong before the fix and right after) rather than just reasoning about it — this class of bug is cheap to reproduce standalone and a numeric before/after is much stronger evidence than "this should work now."
5. When fixing MULTIPLE call sites that perform the identical mutation (five `c.faceDown=!c.faceDown` sites here), batch the recompute once per user gesture rather than once per card where a gesture can affect many cards (`groupFlipUp`/`flipSelected`: a boolean flag set inside the loop, one `updateMyClan()` call after it).


## Skill: Deriving machine facts from KRCG card_text — segment, carry, inherit, and prefer missing over wrong
For any extraction over vtes.json rules text (the cardfx compiler is the reference implementation): (1) segment at newlines AND at bracket tokens — mid-line brackets exist; 3-letter tokens are discipline/virtue requirements (lowercase inferior / UPPERCASE superior, adjacent tokens join '+'), longer ALL-CAPS tokens are type faces on multi-type cards; a token-only chunk carries its tokens into the next chunk (the lookahead split strands them otherwise). (2) Resolve "As above" (372 cards): inherit the nearest earlier fx-OR-dir-OR-lock-bearing segment (v1.4.0: widened from fx-only) preferring the same trigram, own extraction overrides; `lock` uses a real three-state (true/false/undefined) — an explicit negation ("do not lock this vampire") sets false, which BLOCKS inheritance of the prior segment's true (Deflection [DOM] is the canonical case). (3) Pattern conservatism: a wrong tag misleads a bot where a missing tag merely falls back — directed pool damage requires the "from your prey / of their pool / they burn" shapes so self-costs never read as threats; the gate asserts both directions on known cards. (4) Provenance on every entry (`src:'auto'|'hand'`); curated overlay replaces WHOLE entries. (5) Serialize one entry per line, keys sorted — regeneration diffs read as changed cards; the gate carries a shipped-artifact drift guard (fresh compile must byte-match modulo timestamp). (6) Entry-level `persistent` (v1.4.0): THREE signals in priority order — type-implicit (`equip`/`ally`/`retainer`/`event`), "location" keyword anchored to first line, then put-in-play/on prose. Per-mode `lock` (v1.4.0): `\block (this|that) \w+` with a leading `\b` (without it, "unlock"/"block" produce 125 false positives). The mode-emission gate is fx-OR-dir-OR-lock (a lock-only segment like Parthenon has zero fx keys). Vampire names carry group suffixes in this vtes.json generation — plain names resolve via the alias map's deterministic collision ladder (non-ADV beats ADV, newest group wins). (7) Both vtes.json generations are handled per record: `normalizeCard()` mirrors the client's parseV3Card/parseV5Card field map (see "Work with KRCG card data" → v3/v5) — never invent a second field contract; v5's two unknowns (cost shape, title) are read defensively and counted in the report, and the CLI refuses to write a zero-fx artifact (the format-flip tell). Fold discipline full names to trigrams via the client-identical DISC_ABBR ('oblivion'→'obl'; 'FLIGHT' has no trigram and stays 'flight').

## Skill: Add a bespoke card-effect handler (the v1.4.1 CARD_HANDLERS pattern)
For card effects too specific to earn a generic `fx` key (see `cardfx-persistent-lock-design-decisions.md` §10):
1. **Curated data:** add `"handler": "my-card-name"` (entry-level string) in `cardfx-curated.json`.
2. **Registry:** add `'my-card-name': async function(bot){ ... }` in the `CARD_HANDLERS` object near the top of `elysium-bot.js`. The handler runs AFTER the card has resolved (placed on board or ashed) and been logged/pushed.
3. **Wire reuse:** prefer an EXISTING verb over inventing one (`drawCrypt` for Effective Management, `pileBulk` for Ashur Tablets' shuffle-back). Check the protocol doc and the server's handler for the exact shape before assuming.
4. **Scoring:** if the handler involves a CHOICE (Ashur Tablets' "which card to retrieve"), put the scoring in a testable method (`_ashScoreFor`) and the pick in `decide()` — same gather-outside/pick-inside split as `master-play`.
5. **Test:** an offline unit directly against `CARD_HANDLERS['my-card-name'](bot)` with a stubbed `send`, plus a live-integration test with a real server round-trip. For live tests asserting on state that OTHER bot logic can modify the same turn (the `unc` lesson), prefer a stable/monotonic signal (`cryptN`) over a transient array.

## Skill: Detect a cross-table event from another seat's published board (the v1.4.3 Ashur Tablets pattern)
When bot A needs to react to something bot B (or a human) did on THEIR turn:
1. **Don't check the PRECONDITION** ("does anyone show ≥3 copies in ready") — the triggering seat's own handler resolves it the same tick, so the signal is gone before you look. Check a PERMANENT CONSEQUENCE instead (a rising `'burned'` count, or a new card in a zone that only grows).
2. **Track per-seat, over time:** `this._somethingSeenCount = this._somethingSeenCount || {}` — store the count per seat key after each check; only fire when the count RISES, not just when it's nonzero (avoids re-triggering on data that was already there last turn).
3. **Run once per own turn** — hook into `_playTurn` early (after `_recomputePhaseActs`, before any phase logic).
4. **No new wire verb needed** — `this.table[seat].pub.cards` is already relayed by the server for every seat's board push, the same data `_inPlayNorms` already reads.

## Skill: HTTP-surface diagnostics + the error-telemetry toolkit (v2.6.55 / srv-2.6.25–26)

- **`diag-deck-lifecycle.js`** — standalone raw-WS probe that spawns the real server (isolated
  tmp data-dir + random port) and walks five deck-lifecycle scenarios end to end. The template
  for any "did the server eat it?" question.
- **Format battery** — see §C third bullet; the harness pattern lives in the B-53 addendum §7
  and is rebuilt in ~40 lines whenever a parser is under suspicion.
- **`test-error-endpoint.js`** — the live-smoke pattern: two real server spawns (isolated tmp
  data-dirs, random ports), 15 assertions end to end over real HTTP (intake, rate limit,
  oversize, pull route, maintenance control). The template for testing any HTTP surface.
- **`elysium-error-digest.js`** — zero-dep ops companion; `--dry-run` doubles as its test
  harness (the four-mode dry-run matrix is the verification ritual).

## Recipe: Mirror a server handler in hotBridge (the v2.6.122 parity pattern)

When a bot sends (or needs) a verb the hotseat bridge does not relay, the offline bot plays a different game from the online one. Steps:

1. **Read the server handler first and list what it READS from the room**, not only what it sends (`room.tally`, `p.out`, `p.vp`, `nextLiveSeat`). That state must live ON `hotBridge` (`tally`, `_out`, `_vp`), never in a client global -- the bridge is the server here.
2. **Keep the relay self-contained.** The bot project's harness lifts `const hotBridge = {...}` and `function hotFanOut` VERBATIM with no client behind them. Put wire logic in bridge methods (`tallyIn`, `predOf`, `rosterMsg`, `pushRoster`); call client code only through `typeof fn === 'function'` guards inside try/catch (`hotBotOusted`, `hotGivenToHuman`, `MP_HANDLERS`). Verify by lifting it yourself: slice the two constructs out of the HTML into `new Function` with only `localTable` + `VERSION` defined and drive `_fromBot` with fake seats.
3. **Match the server's recipients exactly**: `bcast(room, out)` with no `except` = every bot seat INCLUDING the sender (`botSeats().forEach`), `bcast(..., conn.sock)` = `hotFanOut(msg, seat)`, a single `wsSend` = `toBot(seat, ...)`. The human is reached through the SAME `MP_HANDLERS.x` an online broadcast takes.
4. **Give the human's side the twin.** Every `if(inRoom()) mpSend({t:'x'})` site needs an offline branch through one helper that self-gates on `hotBotsSeated()`, so a human-only hotseat stays byte-for-byte what it was. Do not echo the human's own message back into `MP_HANDLERS` unless the online echo is provably idempotent.
5. **Cross-seat resources: three branches.** Bot seat -> the wire verb (its blob is a placeholder); ACTIVE human -> live `state`; stored human -> blob + pub.
6. **Probe the ORDER live.** An in-process peer may answer INSIDE your `toBot()` call (the bot's send queue drains synchronously while it has tokens). Log `onEvent` on a real bot and assert the event order and the ABSENCE of the bot's fallback event -- a correct outcome can be the other side's safety net at work (v2.6.123).
6b. **If the bot already carries a safety net for the missing relay, read its de-duplication and order your sends so both orders are safe**; assert the single effect in a LIVE `testB`.
7. **Tests:** fake seats (`HB.seats[k]={name, cb:{msg: j=>got.push(JSON.parse(j))}}` + `HB._fromBot(k, HB.seats[k], msg)`) run without the bot file; one LIVE `testB` with real bots. Destructive run with `timeout` -- a parity bug can be a hang.
8. No wire change -> protocol header note only; PROJECT-MANIFEST §E2 if the consumed bot version moves.

## Recipe: Soak a hotseat change (elysium-soak-hotseat.js)

Run it whenever `hotBridge`, `hotFanOut`, `hotRunBotTurns` / `hotAwaitPass` change, when a relay is added or a filter removed, and when a new bot release is consumed.

1. Put the RELEASED `elysium-bot.js` beside the tool, or `--bot <path>` into the bot project; `elysium-cardfx.json` is picked up from beside the BOT file. Without it nobody is ousted and the tool says so; with it (verified 21 Sep: 7 tables, 9 ousts, 0 stuck, ~7 min) the oust path is exercised.
2. **Control first:** `node elysium-soak-hotseat.js --control > out.txt 2>&1; echo $?` -> must be 0 ("the trip-wire FIRED"). Exit 2 with *CLIENT FAULT* = `hotAwaitPass`'s idle clock is broken; with *NOTHING FIRED* = the tool is. Never read `$?` after a pipe.
3. **Battery:** about 15 minutes (a 2-bot table of 10 rounds is ~110 s at `askSecs 1`), i.e. longer than one 300 s tool call. In the sandbox a plain `nohup ... &` DIES with the tool call that started it -- detach properly: `setsid nohup bash -c 'node elysium-soak-hotseat.js > battery.txt 2>&1; echo exit=$? >> battery.txt' >/dev/null 2>&1 </dev/null &`, then poll the file with `sleep`. One table: `--decks hacking,sewer --pool 14 --rounds 14`.
4. Read the summary line WITH its note: `0 ousts` means bounty / roster / the sweep skipping a fallen seat were not exercised.
5. A STUCK table prints the parked bot's `status()` -- start there (what it waits on, `pausedBy`, timer). Reproduce with the same `--decks/--pool`.
6. Quote it beside the bot project's `elysium-bot-hotseat.js` numbers, never instead of them: theirs lifts the bridge and imitates the sweep, ours runs the sweep without a database.
7. Changing the tool itself: re-run the control against a MUTANT client (`hotAwaitPass`'s comparison -> `return;`) and expect exit 2, not a hang.

## Recipe: exclude elements from a whole-surface gesture (wheel / drag on #board)

*Added v2.6.103 (14 Sep 2026), from the pool-globe zoom.*

`#board` owns two gestures that both mean "act on the bare table": the wheel (zoom
toward the cursor) and pointerdown (pan). Anything drawn on top of the board is either
**chrome** (it must swallow the gesture) or **surface** (it must pass it through).

1. **Never encode the rule as "every child stops propagation."** That is an implicit
   contract with one enforcement point per child and no way to read it whole. Two of nine
   did not hold and the bug was invisible until a user scrolled over the pool globe.
2. **One constant, both handlers.** `BOARD_CHROME` (a selector list) + `isBoardChrome(el)`
   (`el.closest(BOARD_CHROME)`, tolerant of `null` and of targets without `closest`),
   declared beside `l3on()` so it is initialised long before either handler can fire.
   Both handlers open with `if(isBoardChrome(e.target)) return;`.
3. **Controls in, surfaces out.** In the list: `.card`, `.l4globe`, `.l4pbtn`, `#edge`,
   `#poolWrap`, `#dockPool`, `#z-hand`, `.zone.pile`, `#phases`, `#l2dock`, `#l2dockbg`,
   `#dockLog`, `#l3zoomCtl`, `#holdBadge`. Deliberately NOT in it: `#z-ready`,
   `#z-uncontrolled`, `#z-torpor`, `.l3mat`, `#l3stage` — in L3 those are most of the
   viewport, and blocking them leaves nowhere to zoom from.
4. **Add the child-level `stopPropagation` anyway**, as belt-and-braces, and keep every
   wheel *consumer* consistent even outside `#board` (`#phases`, the resolver counters).
5. **Pin both halves in the suite.** `isBoardChrome` is pure and testable with a fake
   `{closest}` object — assert the chrome list AND the surface list. Add a source census
   that counts every `addEventListener('wheel'` and requires `stopPropagation()` in all
   but one (the board's own zoom), so a new listener has to declare its side of the rule.
   Match on `stopPropagation()` with the parens: a prose comment containing the word will
   otherwise pass the census.
