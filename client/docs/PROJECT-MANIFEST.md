# PROJECT-MANIFEST.md — what belongs in the Elysium (MAIN) project upload (9 September 2026, after the split)

*The canonical file set for the claude.ai project knowledge, assembled after THE MERGE
(client v2.6.102 · server srv-2.6.35 · bot v0.6.107 · digest v1.4; versions below refreshed 13 Oct 2026 -- client v2.6.149 · srv-2.6.45 · bot v0.6.198, run beside the suite). One lineage. When a file
here disagrees with a chat's latest delivery, the newer version wins — update this manifest
when files are added or retired. Read order for a new chat: CLAUDE.md → the session journal →
project context → learnings → (for bots) CLAUDE-arena.md → (for the next chapter)
elysium-core-plan.md.*

## 0. Where the files live since 12 October 2026 — the monorepo
*The project moved into https://github.com/dtagent2000/VTES-Elysium. Every file in §A–§D is in `client/` (code,
suites, tooling, `CLAUDE.md`, `SKILLS.md`) or `client/docs/` (this manifest, the living docs, ops, plans,
`kodarkivering.md`, `handoffs/`). The repo root is the download: byte copies of §A's deployables plus the bot bundle
(§E2), gated by `check-versions.js`'s root row. The Claude project itself keeps only
`docs/START-HERE-CLIENT-CHAT.md` + `docs/PROJECT-INSTRUCTIONS.md` after the merge; this manifest stays the file
inventory. The eight bundle files are copied into `client/` for the gates and gitignored there.*

## A. Shipped code (deployed to the box / the download bundle)
| File | Role | Version |
|---|---|---|
| elysium-vtes-bord.html | The client — ONE file, built from 12 fragments by elysium-build.js; carries the Help pages (Bots = the bot project's START-HERE-BOTS.html embedded verbatim, Local server = help-local-server.html) | v2.6.149 |
| elysium-server.js | The reference server (rooms, deals, relays, HTTP intake, statics -- four bot files since srv-2.6.43; the room option `tableSetup` since srv-2.6.44; the pub's turn count `tn`/`rn` since srv-2.6.45) | srv-2.6.45 |
| elysium-error-digest.js | Daily Discord digest of elysium-errors.log (systemd timer) | v1.4 |
| elysium-digest.service / .timer | The digest's systemd unit + timer | — |
| START-HERE.html | The GitHub front door for people who do not have the client yet (the client's Help → Local server is the converged in-app guide since v2.6.127) | 1.8 |
| start-elysium(.bat/.sh/.command), start-elysium-guided(...), start-cloudflare-tunnel(...) | Launchers for self-hosters | — |
| Elysium_-_Host_Guide.docx + build-host-guide.js | The host guide and its generator | — |

## B. Build, test and gate tooling (run before every delivery)
| File | Role |
|---|---|
| split_client.py / elysium-build.js | Fragment split ↔ single-file build; B1 gate = split → build → byte-identical |
| elysium-test-harness.js | Loads the client/server under DOM/fs stubs for the suites |
| test-client-logic.js | Client suite (278/0 with bot v0.6.198 beside it as of v2.6.149; 271/0 at v2.6.148; 266/0 at v2.6.147; 265/0 at v2.6.146; 256/0 at v2.6.145; 248/0 as of v2.6.142, incl. the LIVE hold test; 241/0 with v0.6.197 at v2.6.141 — no skips: the LIVE tempo test needs a bot that reads `botcfg` and ran; 240/0 + 1 skip with v0.6.193 at v2.6.140; the `testB` tests skip loudly without the bot; sync battery + testA/testB async runners; `loadClient(path, {storage, location, fetch})` -- `fetch` since v2.6.139) |
| test-server-dispatch.js | Server unit suite (65/0 as of srv-2.6.45; 64/0 at srv-2.6.44; 60/0 at srv-2.6.43; 54 c2s handlers) |
| elysium-soak-hotseat.js | Hotseat soak v1.0.0: real bots on the real bridge through the real sweep; `--control` proves the trip-wire fires; independent watchdog. Needs the released bot beside it; exit 0 / 2 stuck / 3 cannot run |
| embed-help.js | v1.0.0 (v2.6.127): embeds a START-HERE-styled page into the client's Help `<template>`s between the `@@HELP` markers (ids prefixed, page script dropped); `--check` = drift, exit 1. Bots page from the bot project's START-HERE-BOTS.html (verbatim); server page from help-local-server.html (ours) |
| help-local-server.html | Authoring source of the Help → Local server page (START-HERE + Host Guide converged, v2.6.127). Edit here, then `node embed-help.js server help-local-server.html`; the suite's drift test requires it beside |
| test-error-endpoint.js | Live HTTP smoke: spawns the real server (24/0 with the four bot files beside it; without them the bot.js/cardfx checks fail (2) and the two twd checks assert the 404 instead) |
| test-protocol-doc.js | Lints ELYSIUM-PROTOCOL.md §8 against the live handler tables (6/0) |
| test-bot-canary.js | The §12 log-grammar CONTRACT test between the client and the bot's parsers — the bot project's file, identical in both projects; skips loudly without the released elysium-bot.js beside it, 57/0 with v0.6.198 (v2.6.142) |
| check-versions.js | Version lockstep across code + doc headers ("everything agrees"); reads headers from `docs/` too; in the monorepo its last row asserts every root file is a byte copy of `client/<name>` or (the bundle) `bot/<name>` (12 Oct 2026) |

## C. Living documents (update after EVERY implementation)
| File | Role |
|---|---|
| CLAUDE.md | Session bootstrap: newest-first version entries, gate sequence, rules |
| elysium-session-journal.md | Narrative journal (Swedish), newest first — 153 entries (13 Oct 2026) |
| elysium-project-context.md | State of every subsystem, newest-first entries — COMPACTED 9 Sep (pre-24-July entries + June–July per-version sections indexed by title; full text in the archive zip) |
| elysium-learnings.md | Hard-won lessons, newest first — COMPACTED 9 Sep (June–July sections reduced to a title-only lesson index; full text + the bot-harness recipe in the archive zip) |
| SKILLS.md | Recipes for recurring tasks; Reflects-clause = the current round only (history in the archive) |
| **elysium-CHANGELOG.md** | Release notes, newest first, one entry per bump — the VERSION lines carry only the current note from v2.6.73 / srv-2.6.32 / bot v0.6.102 on |
| ELYSIUM-PROTOCOL.md | The client↔server contract (header gated by check-versions; v2.6.149 / srv-2.6.45 — the pub's `tn`/`rn` came with v2.6.149, the optional `tableSetup` field with v2.6.146) |
| elysium-security-manifest.md / elysium-ops-runbook.md / elysium-hosting-plan.md | Ops: threat model, runbook (jq recipes, purge ritual), hosting |
| kodarkivering.md | Parked client code (retired features) — reference, not policy |

## D. Design documents and plans (read when working the area)
| File | Area |
|---|---|
| **elysium-core-plan.md** | NEXT CHAPTER: one brain for the table (shared core → local server) |
| elysium-hotseat-bots-plan.md | HB2 architecture: bot seat = remote player, hotBridge duties, slices (the client side of the bots; the bot project keeps a read-only copy) |
| elysium-dump-design.md | B-63 diagnostic dump design (D1–D4 decisions, traps T1–T7) |

## E. Archived out of the project on 9 Sep 2026 (in elysium-project-archive-2026-09-09.zip)
| File | Why |
|---|---|
| CLAUDE__2_.md | The bot chat's CLAUDE.md — merged into CLAUDE.md on 9 Sep |
| diag-arena-bounce.js, diag-block-verdict.js, diag-exhaust.js, diag-ladder.js, diag-mp.js, diag-s33.js, diag-steg2.js, diag-turn3.js | One-off diagnosis scripts from July/Aug rounds; referenced only in comments/journal, nothing requires them |
| harness-l3-4p.js | v2.5.61 L3 4-player grid proof harness — superseded by the client suite |
| sfx-audio.js | A loose copy of one build FRAGMENT; the splitter regenerates it from the client |
| deck-wall.json | Wall archetype RETIRED 4 Aug (DECK_STRATEGY keeps the spec) |
| elysium-relocation-brief.md | Completed hand-off (relocation Phase 2, done) |
| elysium-project-context-archive-2026-09-09.md, elysium-learnings-archive-2026-09-09.md | The verbatim text compacted OUT of the two living docs (301 + 429 kB). Keep beside the project; upload to a chat only when an indexed title needs its full story |
| elysium-history-2026-09-09.md | The release-note chains extracted from the client/server/bot VERSION lines, the protocol header, SKILLS and CLAUDE.md's pre-24-July entries (217 kB, verbatim) |
| t9a-deck-read-verification.md | Spike result (16 July, verdict GO) — historical |
| elysium-b63-codepatch.py, elysium-b63-docpatch.py, elysium-v2_6_64-codepatch.py, elysium-v2_6_64-docpatch.py | Parallel-lineage patch scripts delivered earlier in the telemetry chat (never in the project) — obsolete after the merge; not carried forward and NOT in the archive zip (only your earlier downloads have them) |

## E2. Consumed releases from the sister project **Elysium Bots** (NOT in this project's knowledge)
| Artifact | Bundled/deployed version | Where it goes |
|---|---|---|
| elysium-bot.js | **v0.6.198** (12 Oct 2026), run unchanged beside client v2.6.146 and v2.6.147 / srv-2.6.44 on 13 Oct (266/0, canary 57/0, soak control exit 0, endpoint 24/0; added from the lobby of a Classic room against the real server — it camps as before and the client's table setup steps aside; our ask to follow the seats: `REPLY-to-bot-2026-10-13-table-setup.md`). Run unchanged beside v2.6.149 / srv-2.6.45 (278/0, canary 57/0, a three-bot soak, its rigged equipment now drawn on the vampire on both styles; `REPLY-to-bot-2026-10-13-v2.6.149.md`). Reviewed on 13 Oct for Classic tables, read and run unchanged (soak per board style, a live table with three socket bots, a lobby table on main's pair): `REPLY-to-bot-2026-10-13-classic-review.md` — one hard stop (`_openSlot` on a full Classic row), equipment without `host`, permanents at fixed felt points. First deployed with client v2.6.142 — the Hold-on principle built (a human's Hold on stops every bot wait; a release from any human frees the table), RUN beside the suite before main changed anything (v2.6.141 241/0) and after (v2.6.142 248/0 incl. the LIVE hold test; canary 57/0, soak control exit 0, endpoint 24/0); reply `REPLY-to-bot-2026-10-12-v0.6.198.md`. Before that: **v0.6.197** (11 Oct 2026) with client v2.6.141 — handoffs v0.6.195–197 read and answered (`REPLY-to-bot-2026-10-11-v0.6.197.md`), and RUN beside the suite at v2.6.141 (the zip came the same evening): client 241/0 incl. the LIVE tempo test, canary 57/0, soak control exit 0, endpoint 24/0. Before that, last run beside the suite: **v0.6.193** (28 Sep 2026) for client v2.6.139 / srv-2.6.43: client suite 236/0 (incl. the LIVE tests), canary 57/0, endpoint 24/0; v2.6.140 240/0. Deployed on the box: v0.6.173 per the bot project's handoff ('v0.6.174 → 193 since the last deploy'; `curl -s https://elysium.cards/elysium-bot.js | grep -m1 BOT_VERSION` is the receipt). The client ENFORCES ≥ v0.6.147 at load (`hotBotVersionOk`). v0.6.193 does not read `botcfg`; v0.6.194+ does; Bot settings' hold line is hidden for a loaded bot older than v0.6.198 (`botCfgHoldLine`) | beside the server on the box (hosted route) + the download bundle; beside the client suite for the `testB` tests |
| elysium-cardfx.json / elysium-cardfx.js | the JSON unchanged through v0.6.198; `elysium-cardfx.js` first in hand with v0.6.198 — the bot project rebuilt it from the deployed JSON for its 12 Oct `bundle/` (their 10 Oct zip never carried it); recompiled 25 Sep 2026 (compiler v1.9.0: `ranged`, Bowl of Convergence's paid intercept; 99 curated, 1,670 library entries with effects) | hosted route (json) + bundle (both) |
| elysium-twd-profile.json / elysium-twd-archetypes.json | 27–28 Sep 2026 (the knowledge layer: TWDA profile from 4,672 decks; 42 archetype signatures). The client hands both to every browser bot (`twdProfile` / `twdArchetypes`) since v2.6.139; served by srv-2.6.43. The profile was REBUILT 11 Oct (v0.6.197: a fifth share, `press`, appended — purge `/elysium-twd-profile.json`); the archetypes are unchanged. The file:// `.js` twins `elysium-twd-profile.js` / `elysium-twd-archetypes.js` ship since v0.6.195 (same serialize as the JSONs); main holds all three twins since v0.6.198 (the bot project's 12 Oct `bundle/`, checked value for value; the 10 Oct zip never carried `elysium-cardfx.js`) | hosted route (the JSONs) + bundle (JSONs and `.js` twins) |
| START-HERE-BOTS.html | the client embeds the 12 Oct 2026 issue since v2.6.142 (bot v0.6.198: the Hold on row, the Turn-based safety net, the damage step note, the footer — their text, verbatim); earlier issues 28 Sep, 9, 10 and 11 Oct (v0.6.195–197: the tempo gear and ▶, Close step / Close poll, combat ends, the damage step, the referendum line) | embedded in the client (Help → Bots) + download bundle |
Everything else bot-shaped (arena, table, gen-*, decks, bot suites, bot design canon, CLAUDE-arena→their CLAUDE.md, SKILLS-arena→their SKILLS.md) lives in that project. Rule: consume, never edit here.

## F. Not project files (environment / downloaded assets)
`vtes.json` (KRCG card database — refreshed quarterly per the runbook), `images/`, `elysium-errors.log`, traces (`serie-*/`), `admin.env`, saves.

## G. Currency caveats
The section-B/D files marked "unchanged since the project snapshot" were taken from the project as it stood on 9 Sep; if the bot chat delivered NEWER copies of `elysium-bot-arena.js`, `elysium-bot-table.js`, `gen-*.js`, `SKILLS-arena.md`, `test-cardfx.js` or `cardfx-curated.json` after the snapshot was last synced, those newer copies win — compare version strings before replacing.
