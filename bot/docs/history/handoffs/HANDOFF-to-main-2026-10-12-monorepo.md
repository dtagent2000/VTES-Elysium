# Handover to main — the repository is a monorepo now; sync your half into `client/` (12 October 2026)

**From:** Elysium Bots · **To:** the client/server project (main) · **Repo:** https://github.com/dtagent2000/VTES-Elysium (public; `main` is the only branch after PR #1 was merged 12 Oct 13:28)
**Bot changes needed:** none. **Protocol changes:** none. This is pure plumbing — where files live and how releases move.

## 1. What is already there (merged in PR #1)

```
/                       THE DOWNLOAD — what a player gets. Client/server/start scripts still YOUR 23 Sep upload
                        (client v2.6.38-era, srv-2.6.38); the bot bundle refreshed to v0.6.198 (see §4).
/CLAUDE.md              the one rule for both halves + layout + deploy rule (read it first; it is short)
/README.md              your text, plus a "Bots" section and a "Repository layout" table at the end
/.gitignore             serie-*/, bench-*/, twd_decks.json, __pycache__, node_modules, *.zip
/Documentation/         YOUR folder, untouched — to be MOVED by you to client/docs/ (§2)
/client/README.md       a placeholder reserving the folder for you; overwrite it
/bot/                   the whole bot project, flat (suites/arena/tools want their files beside them):
                        bot v0.6.198, arena, cardfx pipeline, suites, decks, tools, vtes.json, docs/
```

Everything at the root that is yours is byte-identical to your upload — nothing of yours was edited.

## 2. What you do (one branch, one PR)

1. Clone (or attach) the repo; `git checkout -b client-sync` from `main`.
2. Put your sources in `client/`: `elysium-vtes-bord.html` (the build's split parts too if you keep them —
   `split_client.py` / `elysium-build.js` and their inputs), `elysium-server.js`, the start scripts
   (`start-elysium*.{bat,command,sh}`, `start-cloudflare-tunnel*`), `elysium-test-harness.js`, every
   `test-*.js` of yours (incl. your copy of `test-bot-canary.js`), `check-versions.js`, `ELYSIUM-PROTOCOL.md`,
   `Elysium_-_Host_Guide.docx`, `START-HERE.html`, ops files.
3. `git mv Documentation client/docs` — then your living docs (`CLAUDE.md`, `SKILLS.md`, journal, learnings,
   context, backlog, CHANGELOG, PROJECT-MANIFEST) live in `client/` / `client/docs/` as you prefer. Your
   `CLAUDE.md` stays named `CLAUDE.md` — Claude Code reads the root one AND the one in the folder you work in;
   the two do not collide and must not be merged (different code, different gates).
4. **Deploy = copy to the root:** copy your current release (client **v2.6.141**, **srv-2.6.43**, the start scripts,
   `START-HERE.html`, the host guide) from `client/` to `/`. Never edit a root file in place; it is a copy of a
   release. Leave the bot bundle files at the root alone (§4) — they are our release.
5. Do not touch `bot/`. If something in there looks wrong to you, write it in your reply doc, not in the file.
6. Open a PR against `main`. Johan merges (he can ask the bot chat to review first).

## 3. The read-only copies inside `bot/` — yours, frozen by us

`bot/elysium-server.js` (srv-2.6.38 — the arena spawns it), `bot/ELYSIUM-PROTOCOL.md`, `bot/elysium-vtes-bord.html`
(v2.6.141 — the canary and the hotseat gate drive it), `bot/elysium-hotseat-bots-plan.md`. We refresh them by
copying your release in when a gate needs it; you never edit them. After your sync we will copy srv-2.6.43 and the
current protocol from `client/` into `bot/` ourselves and re-run canary + hotseat gate (the canary is 57/0 against
v2.6.141 today).

## 4. The bot bundle at the root (ours, consumed by you)

`elysium-bot.js` (v0.6.198) · `elysium-cardfx.json` / `.js` · `elysium-twd-profile.json` / `.js` ·
`elysium-twd-archetypes.json` / `.js` · `START-HERE-BOTS.html`. Byte-identical to the same files in `bot/`.
The twd files are the TWDA prior the bot reads (`START-HERE-BOTS.html` already says so); your server's sibling-statics
route should serve all six data files beside the bot, exactly as it serves `elysium-cardfx.json/.js` today
(`elysium-twd-profile.js` / `elysium-twd-archetypes.js` are the `file://` vehicles, same pattern as `elysium-cardfx.js`).
A bot release = we bump `BOT_VERSION`, copy the bundle to the root, PR; you consume it by noting the version in
your manifest. Nothing for you to build.

## 5. Suggested gate (yours — `check-versions.js`)

Add an assertion that the root equals the two halves byte for byte: each root file is either a copy of
`client/<same name>` or of `bot/<same name>` (the eight bundle files). Then "the root is the download" is enforced,
not promised. Cheap: a loop over the root's non-dot files with `fs.readFileSync` + compare.

## 6. Handoffs from now on

Ours to you: `bot/docs/handoffs/HANDOFF-to-main-<date>-<version>.md` (this file is the first in the repo).
Yours to us: put replies where you like under `client/docs/` and name the path in the PR description; we will copy
the reply into `bot/docs/handoffs/` as before (`REPLY-to-bot-*.md`) so the bot side keeps its own trail.
A change that needs both sides still goes contract first (your PR), bot second (our PR) — never both in one PR.

## 7. Known states to carry over from the bot side (nothing to do, just so your docs match)

- Bot v0.6.198 built against client v2.6.141 / srv-2.6.43 per your reply of 11 Oct; gates on the merged bytes:
  canary 57/0, HB1 11/0, hotseat 10/0, test-cardfx 261/0, suite 1933/0 (run in the delivering chat).
- Open leads on our side (from `HANDOFF-to-main-2026-10-12-v0_6_198.md`, unchanged): the late steal line, the
  200 ms maneuver window, the R6 audit, a bleed-modifier grace outside the tempo, hold during bot-vs-bot combat vs
  the 2 s handshake. None needs a contract change yet.
- `twd_decks.json` (10 MB) is ignored by git on purpose; only our profile build reads it.

## 8. Your chat project, after the sync (what we did on the bot side today — same recipe)

Once your PR is merged, slim the client Claude project to TWO files and delete the rest — every other file is a
copy of something in git and will drift the moment someone commits:

1. **The project instruction** (the paste-in text): "The repo is the truth: https://github.com/dtagent2000/VTES-Elysium —
   `client/` is ours, `bot/` is the bot project's, the root is the download. Clone, read root `CLAUDE.md` and
   `client/CLAUDE.md` first, then your journal (newest first), context, learnings. Branch from `main` → change →
   gates → living docs → commit + push often → PR against `main`; Johan merges. Never touch `bot/`; needs go as a
   handoff/reply under `client/docs/`. A release = copy client, server and start scripts from `client/` to the root —
   never edit the root in place." Keep your own gate list and release ritual as they are today; only the file
   locations change.
2. **A one-page `START-HERE-CLIENT-CHAT.md`** (also committed in `client/docs/` so it stays current): repo link,
   current versions and gate numbers, the first five commands, where things are, what is open. Ours is
   `bot/docs/START-HERE-BOTS-CHAT.md` — copy its shape.

Do it only after the sync PR is merged, so the instruction points at folders that exist. Memory needs nothing from
Johan: the repo fact is already filed from today's chats.
