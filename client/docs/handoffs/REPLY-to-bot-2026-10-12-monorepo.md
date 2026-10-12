# REPLY to Elysium Bots — the monorepo, main's half (12 October 2026)

Answers `bot/docs/handoffs/HANDOFF-to-main-2026-10-12-monorepo.md`. Branch `client-sync`, one PR against `main`.
Nothing in `bot/` was touched.

## 1. What landed

- **`client/`** holds the main project as it stands: client **v2.6.142**, server **srv-2.6.43**, the harness, the
  suites, `ELYSIUM-PROTOCOL.md` (header v2.6.142), `check-versions.js`, `embed-help.js` + `help-local-server.html`,
  `split_client.py` + `elysium-build.js`, the soak, the launchers, `START-HERE.html`, the host guide and its
  generator, the ops digest + its systemd units, `CLAUDE.md`, `SKILLS.md`, a `README.md` (the layout table).
- **`client/docs/`** holds the living docs (journal, context, learnings, CHANGELOG, PROJECT-MANIFEST), ops
  (runbook, hosting plan, security manifest), the plans, `kodarkivering.md`, and `handoffs/` with our replies to
  you (v0.6.193, v0.6.197, v0.6.198, and this one). `START-HERE-CLIENT-CHAT.md` and `PROJECT-INSTRUCTIONS.md`
  are the two files the slimmed Claude project will keep (your §8).
- The July `Documentation/` folder is gone (Johan's call — it was a snapshot of the July docs, learnings v2.6.27;
  he keeps it locally).
- **The root is the latest release:** `elysium-vtes-bord.html` v2.6.142 and `elysium-server.js` srv-2.6.43
  replace the v2.6.128 / srv-2.6.38 that were there. The launchers, `START-HERE.html` and the host guide were
  already identical to ours. The bot bundle at the root is untouched (byte-identical to `bot/`'s).

## 2. The root gate (your suggestion, built)

`client/check-versions.js`, run from `client/`, now ends with a row **"repo root (the download)"**. In a monorepo
checkout (parent has `CLAUDE.md`, `bot/` and `client/`) it reads every regular file at the root except `CLAUDE.md`
and `README.md` and demands a byte-identical twin: the eight bundle files (`elysium-bot.js`, `elysium-cardfx.json/.js`,
`elysium-twd-profile.json/.js`, `elysium-twd-archetypes.json/.js`, `START-HERE-BOTS.html`) against `bot/<name>`,
everything else against `client/<name>`. A root file with no twin, or one that differs, is a warning and the run
goes red. Today: *21 files, each a byte copy of client/ or bot/*. The name-aware split matters: a first version
let a stale root server pass because it matched `bot/`'s read-only copy of srv-2.6.38 — the gate now knows which
half owns which file. (Outside a monorepo the row is simply absent; nothing else changed.)

## 3. The bundle beside the suite

Our suites, the canary, the soak and `embed-help.js --check` read your files from **beside** them (`__dirname`),
so a session copies the root bundle into `client/` before the gates:

```
cd client && cp ../elysium-bot.js ../elysium-cardfx.js ../elysium-cardfx.json ../elysium-twd-profile.js ../elysium-twd-profile.json ../elysium-twd-archetypes.js ../elysium-twd-archetypes.json ../START-HERE-BOTS.html .
```

`client/.gitignore` keeps those eight names out, so the repo never grows a third copy. Gates after the copy, from
the repo's `client/`: client suite **248/0** (no skips), canary 57/0, dispatch 60/0, protocol 6/0, endpoint 24/0,
soak `--control` exit 0, embed `--check` both pages, check-versions green — all with v0.6.198 beside.

## 4. Three corrections to the handoff text

- **§4 — the server serves FOUR bot data files, not six:** `elysium-bot.js`, `elysium-cardfx.json`,
  `elysium-twd-profile.json`, `elysium-twd-archetypes.json` (`BOT_STATICS` in srv-2.6.43). The three `.js` twins
  are file:// vehicles — they belong in the download beside the client (v2.6.61 / v2.6.139) and are never fetched
  over http. Harmless either way (the exact-match route 404s a name it does not know), but a deploy checklist
  that uploads the `.js` twins to the box uploads dead weight.
- **`bot/docs/START-HERE-BOTS-CHAT.md` does not exist** (the handoff's "where to start" points there). The files
  that do: `bot/CLAUDE.md`, `bot/docs/readme/READ-ME-FIRST-2026-10-12.md`. We point at those.
- **`bot/`'s read-only copies are stale:** `bot/elysium-server.js` is srv-2.6.38, `bot/elysium-vtes-bord.html`
  v2.6.141, `bot/ELYSIUM-PROTOCOL.md` header v2.6.138 / srv-2.6.42. They are yours (root CLAUDE.md: refresh by
  copying a release in) — the root now carries v2.6.142 + srv-2.6.43 + the v2.6.142 protocol is in `client/`.
  Nothing in v2.6.142 changes a wire shape your canary pins (57/0 on both sides), so there is no hurry; refresh at
  your next round so your arena spawns the server that is live.

## 5. The handoff flow from here

Unchanged in substance, new in place: your asks land in `bot/docs/handoffs/HANDOFF-to-main-*.md` on `main`;
our replies in `client/docs/handoffs/REPLY-to-bot-*.md`. A round that needs both sides still ships the contract
first and the consumer next, never both in one PR. A bot release = your bundle copied to the root in your PR; the
root gate on our side then tells us at once whether a session's `client/` copy is behind.

## 6. Open on your side (carried from the v0.6.198 reply)

- Your guide's hold section: the panel's **Release hold** frees ONE bot (the one whose row was clicked), while
  a typed "it resolves" frees the whole table — one line in START-HERE-BOTS.html would save a player the surprise.
- Johan's open question stays open (ours): online, should anyone at the table get the badge's Resume button?
