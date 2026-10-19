# START-HERE-BOTS-CHAT.md — the only file a new bot chat needs before it has cloned (19 October 2026)

**Repo:** https://github.com/dtagent2000/VTES-Elysium — `main` is the truth; `bot/` is this project.
**State at writing:** bot v0.6.208 (deploy candidate, awaiting Johan's merge: `FX_NORM` client-identical again, main's REPLY 2026-10-19; v0.6.207 = PR #28, merged) · arena v1.4.8 ·
cardfx compiler v1.9.2, curated 105 · built against client v2.6.167 / srv-2.6.49 · gates: see the newest READ-ME-FIRST.

## First five minutes
```
git clone https://github.com/dtagent2000/VTES-Elysium && cd VTES-Elysium
cat CLAUDE.md                                  # the one rule, the layout, deploy = copy to the root
cat bot/CLAUDE.md                              # the bootstrap: version handshake, every gate, every doctrine
ls bot/docs/readme/ | tail -1                  # the latest READ-ME-FIRST — read it
head -200 bot/docs/elysium-bot-session-journal.md   # newest entry first
git checkout -b <topic>                        # never work on main
```
Then `bot/docs/elysium-bot-project-context.md`, `bot/docs/elysium-bot-learnings.md`, `bot/SKILLS.md`.
`bot/README.md` maps the folder (code · gates · series tools · docs/ layout).

## What is where
- `bot/` is flat on purpose: suites, arena and tools expect `vtes.json`, the decks, the cardfx files and the
  read-only client/server copies beside them. Run everything from inside `bot/`.
- `bot/docs/` — living docs at the top; `readme/` (every delivery), `handoffs/` (to main + main's replies),
  `reports/`, `specs/`, `reviews/`, `coverage/`, `archive/` (old manifests/TODOs; the 21 Sep TODO still maps the
  older debts).
- `bot/tools/mutants/` — the hold-gate mutant isolation (`python3 tools/mutants/mutate-v0_6_198.py /tmp/mut`).
- NOT in git: third-party data — `vtes.json` (KRCG, v3 shape; `test-cardfx.js`, the cardfx compiler, the coverage
  and profile tools) and the TWDA (`twda.json` + optional `twda-vdb.json`, only to rebuild the profile). Fetch from
  the source; when the sandbox cannot reach it, attach the private repo `dtagent2000/VTES-Elysium-data` and copy
  from there (root `CLAUDE.md`, 'Data that is not in git'). Arena traces (`serie-*/`, `bench-*/`) are generated.

## The loop
branch → change → gates (inside `bot/`) → living docs + READ-ME-FIRST (+ HANDOFF when main must act) →
commit + push often → PR against `main` with the gate numbers in the body → Johan merges.
A bot release additionally bumps `BOT_VERSION` and copies the bundle to the repository root.

## Open at hand-over (19 Oct 2026)
v0.6.208 (this round): main's client v2.6.167 made `norm()` transliterate ł ø œ æ ß đ ð þ ı (Przemysław rendered blank);
`FX_NORM` now does the same (`FX_NORM_LETTERS`), so a deck typed in plain letters finds its cards, and section 154f compares
`FX_NORM` with the released client's `norm()` over every cardfx name. Main's optional point (the TWD profile's exact-key
lookups) is parked. Main's PRs #27, #29, #30, #32 and #33 are merged (client v2.6.163–167, srv-2.6.47–49); their replies to
v0.6.206, v0.6.207, the robustness review and the open hand (`client/docs/handoffs/REPLY-to-bot-2026-10-1[7-8]-*.md`) are
not yet consumed in a bot round. The text below is the 17 Oct hand-over, still valid for what comes next.

The 14 Oct play-test (main's rig, PR #13) was reviewed finding by finding in `bot/docs/reviews/REVIEW-playtest-2026-10-14.md`;
R0–R4 shipped as v0.6.199–205 (all merged). v0.6.206 (PR #26, merged) is the round agreed with Johan on 16 Oct 21:27
(`bot/docs/specs/spec-next-2026-10-17.md`): the late bounce of R4's final smoke fixed (a Magic of the Smith's note read as an
equip announce; three layers); two faults in the actor's block windows found by the release's own smoke and fixed (the stale
guard anchors on the line that opens the window; a window opens in the same tick as its line — a 150 ms sleep since v0.6.144
lost bot answers at pace 0, so every arena number since then carried ~3 s of dead clock per bleed total); the probe
reservation behind knob `probeHold`, measured in the new probe lab (`lab-probe.js`): +0.80 pool per probe turn when the actor
out-numbers its prey's unlocked bodies, nothing otherwise. Johan took both of its proposals after the merge (17 Oct), so they
are v0.6.207: `probeHold` 2 is the default (his bait read), and main's finding 1 is built (the chat beat separates two chat
bubbles and nothing else; a hold or resume line skips it). His note on the probe's lost tables (a prey holding a wake) is a
knowledge-layer item (`bot/CLAUDE.md` 65f). Main's PR #27 (client v2.6.163 + srv-2.6.47, a security release) was open at
writing, with their reply to v0.6.206 (`client/docs/handoffs/REPLY-to-bot-2026-10-17-v0.6.206.md`); consume it once merged.
Next, in Johan's order: the 14 Oct scenario in `client/playtest/` with `--dir` on a scratch copy of the root with
the bot branch, compared with the report's numbers; then the larger re-measure, against a baseline run on v0.6.207 (not on
older numbers — the dead clock); the parked items in READ-ME-FIRST-2026-10-16f, 'Next'. Known, not built: a human's bounce of a
bot's bleed is not read by the acting bot; a human's Haven Uncovered is not read by the bots; between bots a contested block's
verdict waits for the actor's clock (~3 s at the arena's askSecs). Johan's rule since 16 Oct: fixes that belong together may be
combined in one round; design questions still go through a proposal and "kör".
