# Extraction checklist — where every part of the old `bot/CLAUDE.md` (v2.0, `CLAUDE-v2-2026-10-20.md`) went (round C1, 20 Oct 2026)

| Old CLAUDE.md (line) | New home |
|---|---|
| 1–5 header, the 12 Oct git note, the "read these FIRST" line | CLAUDE.md "Bootstrap"; the git-era facts in root CLAUDE.md |
| 7–12 the split and THE RULE | CLAUDE.md "The one rule"; RULINGS D-85 |
| 14 the version handshake: the current release (v0.6.211) | STATUS "Last gates", "What v0.6.211 did" |
| 14 the handshake: v0.6.112–210 | `handshake-v0.6.112-v0.6.211.md` here (one release per line); every release is also in the CHANGELOG |
| 14 the plan rule (v0.6.119c) | CLAUDE.md binding rules, "the plan rule" |
| 14 the arena rule (a detached series dies at a turn boundary) | retired with the chat sandbox; CLAUDE.md "Gates" says detached + `run_in_background`; HOWTO "Running" |
| 14 the table-model rule (v0.6.118) | CLAUDE.md "the table-model rule" |
| 14 the duplicate rule (v0.6.117) | CLAUDE.md "the duplicate rule"; RULINGS D-64 |
| 14 the cardfx cost rule (v1.6.14) | CLAUDE.md "the cardfx cost rule" |
| 14 the tier rule (v0.6.114) + timing invariants (v0.6.115) | CLAUDE.md "the tier rule"; the stopwatch invariants are in CLAUDE.md "the hold gate"; LESSONS "Timing" |
| 14 the helper-gate rule (v0.6.113) | CLAUDE.md "the helper-gate rule"; RULINGS D-63 |
| 14 debug density (v0.6.112) | CLAUDE.md "Debug density" |
| 14 the srv-2.6.35 / 2.6.37 copy note, "owed to main: blocks./attempts to block." | stale (both long done); history |
| 16 combining fixes (Johan, 16 Oct) | CLAUDE.md "The round"; RULINGS D-92 |
| 18 the sim table (19 Oct) | CLAUDE.md "Gates" and "Determinism and footprints"; HOWTO "The sim table"; RULINGS D-71 |
| 20 the combat handshake rule (v0.6.156, 202, 203) | CLAUDE.md "the combat handshake rule"; RULINGS R-28, R-29 |
| 22 the look-ahead rule (v0.6.205) | CLAUDE.md "the look-ahead rule"; LESSONS "a hook called by a unit test" |
| 24 the window rule (v0.6.206) + count in the arena, weigh in a lab | CLAUDE.md "the window rule", "Count in the arena, weigh in a lab"; HOWTO (`ana-windows.py`, the probe lab) |
| 26 knob hygiene (v0.6.162) | CLAUDE.md "Knob hygiene" |
| 28 the ledger gate (v0.6.163, 196, 202, 203) | CLAUDE.md "the ledger gate"; HOWTO "Analysing"; LESSONS "pair the rows" |
| 30 the block gate (v0.6.170) | CLAUDE.md "the block gate"; RULINGS R-12, R-14 |
| 32 the event log (v0.6.176) | CLAUDE.md "the event log" |
| 34 the invariant gate (v0.6.180, 203) | CLAUDE.md "the event log" (the classifier) and "Gates" (`ana-inv.py`); HOWTO |
| 36 the bench gate (27 Sep) | CLAUDE.md "Count in the arena, weigh in a lab"; RULINGS D-81; HOWTO "The mirror bench" |
| 38 the knowledge layer (v0.6.187+, 197) | CLAUDE.md "the knowledge-layer rule"; RULINGS D-82 |
| 40 the hold gate (v0.6.198) | CLAUDE.md "the hold gate"; RULINGS D-67 |
| 42 the tempo gate (v0.6.194, 195) | CLAUDE.md "the tempo gate"; RULINGS D-66 |
| 44 lines are the contract (main, 23 Sep) | CLAUDE.md "Lines are the contract"; the helper-lock ask → BOARD "Ask main once" (d) |
| 46 gates (the battery; "an abort on the pre-change bot is not the environment") | CLAUDE.md "Gates"; HARNESS; LESSONS "a baseline is only a baseline"; the stale numbers (701/0, 37/0, timeout 210, upload …) retired |
| 48 versioning | CLAUDE.md "The one rule" (the BOT_VERSION line); HARNESS "The release ritual" |
| 52–60 (formerly) CLAUDE-arena: purpose, the HB track history | history; ARCHITECTURE "The three environments" (the bot seat is a remote player; HB1 is the browser gate) |
| 62–74 expected state / sanity battery (701/0, v0.6.88) | stale; replaced by STATUS "Last gates" and CLAUDE.md "Gates" |
| 76–120 the eight-step loop, the evaluation doctrine, the VP facts, the recommend structure, the docs ritual, the standing question | HARNESS "The round"; CLAUDE.md "Evaluation doctrine" and "Traces" (VP facts); HOWTO "Reading rules"; LESSONS "the standing question" |
| 122–137 the arena CLI, decks, personas, knob whitelist, timing | HOWTO "The arena"; CLAUDE.md "Personas and decks" |
| 139–150 the emit vocabulary | HOWTO "Emit vocabulary" |
| 152–153 the deep review of 11 Sep, the two tracks, B1/B2 status | history; the standing parts are the specs (`elysium-bot-block-doctrine.md`, `elysium-bot-review-2026-09-11.md` in reviews/); ARCHITECTURE "Design canon"; RULINGS D-8, D-85, D-86 |
| 155–165 the open items ledger (F-Q2, hacking as the predator, wall retired, B-55e-b, B-55f-b) | F-Q2 closed (CL 68); hacking-as-predator → CLAUDE.md "Personas and decks" (hacking = the benchmark) and RULINGS D-89 (balanced design); B-55e-b / B-55f-b → BOARD "Known, not built" (intercept banking, `by: null`) |
| 167–169 the arena v1.2.5 / v1.2.6 notes (VEKN winner, manifests carry seat) | CLAUDE.md "Traces" |
| 173–191 debts 1–19 | RULINGS (R-17, D-43, D-47 …; O-13, O-18, O-19, O-21, O-29, O-31, O-33, O-34); BOARD (`_wakeCard`, forecast calibration, the turn ledger's gaps 26d); the rest history |
| 192–218 debts 66–70 (hotseat parity, the hotseat net, personas renamed) | RULINGS D-79, D-80; BOARD (70g); HOWTO (70f); ARCHITECTURE "The three environments"; HOWTO "The hotseat tool"; history |
| 219–234 debts 64–65 (the knowledge layer) | `specs/spec-knowledge-layer.md` (verbatim); RULINGS D-77, D-78, O-7; BOARD (Kevlar, wakes) |
| 235–243 debts 62–63 (the bounce reserve, bal8) | RULINGS D-5, O-1; history |
| 244–249 debts 60–61 (Nosferatu, Taste of Vitae) | RULINGS D-23, O-10; BOARD "Nosferatu's Fame chain", "Taste of Vitae" |
| 250–264 debts 56–59 (the defence doctrine, the late bounce, bal6/bal7) | RULINGS D-2, D-3, D-4, O-1, O-2; history |
| 265–289 debts 51–55 (the stealth-bleed doctrine, the second look, the probe rule, bal5) | RULINGS D-11, D-12, D-13, R-13; history |
| 290–302 debts 47–50 (bal3/bal4, Freak Drive, act-again survival) | RULINGS D-48; LESSONS "find the binding term"; history |
| 303–316 debts 44–46 (the freeze, Second Tradition, Hidden Strength, Ventrue's gaps) | RULINGS R-11, D-22, O-6; CLAUDE.md "The pool rule" (every pool loss has the oust check); BOARD; history |
| 317–324 debt 43 (the goal, deck feel, the observability gap) | CLAUDE.md "The goal"; RULINGS D-76; history |
| 325–350 debts 36–42 (home pricing, the critical pool, the racing rule, home2) | RULINGS D-46, D-47, D-49, D-50; BOARD (the 42c soft spots); LESSONS "Reading traces"; `history/specs/spec-home-pricing-2026-09-19.md` |
| 351–366 debts 33–35 (the balanced baseline, the Blood Doll loop, deck fit) | RULINGS D-44, D-45, D-75, D-89; LESSONS "find the general measure"; history |
| 367–392 debts 28–32 (the null, permFirst, rushes, the three layers) | RULINGS D-19, D-20, D-21, D-39, D-48, R-18, R-33; history |
| 394–412 debts 24–27 (the live probe, cost on success, the rulings round, Daring the Dawn) | RULINGS R-9, R-10, R-17, R-19, D-37, D-38, O-15, O-21; CLAUDE.md "the self-price rule", "a new bot line"; STATUS (the lines owed to §12); history |
| 413–431 debts 20–23, 25 (politics self-review, Troublemaker, the hand-over review) | RULINGS D-36, O-14, O-16; BOARD "Vote-count residue", "`_wakeCard`"; history |
| 432–452 debts 16, 21–24 (meta lever, crypt sweep) | RULINGS O-31, O-21; history |
| 455–460 section 71 (the breath: the beat rule, the ahead rule, intercept by chat, v0.6.153) | CLAUDE.md "the beat rule", "the ahead rule"; RULINGS D-14, D-65, R-16 |

SKILLS.md → HOWTO (the standing techniques) + `history/SKILLS-2026-10-20.md` (verbatim). The journal, the context and the learnings
→ `history/` verbatim; the learnings → LESSONS (distilled). The READ-ME-FIRSTs → `history/readme/`. The 21 Sep TODO stays in
`archive/` (its §9 evaluation of the older debts is the map behind several O-lines).
