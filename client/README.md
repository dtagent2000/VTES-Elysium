# client/ — the Elysium client & server project (main)

This folder is the client/server project ("Elysium", main). The bot project never writes here, and this folder
never writes to `bot/`. The root `CLAUDE.md` states the one rule; `client/CLAUDE.md` is this project's own
session bootstrap (newest-first release entries, the gates, the hard-won invariants).

**Start a session here:** `docs/START-HERE-CLIENT-CHAT.md` (versions, the first commands, where things are,
what is open) → `CLAUDE.md` → `docs/elysium-session-journal.md` (newest first) → `docs/elysium-project-context.md`
→ `docs/elysium-learnings.md` → `SKILLS.md`.

## Layout

| Where | What |
| --- | --- |
| `elysium-vtes-bord.html` | the client — ONE file; the `<script>` body also splits into twelve fragments (`split_client.py` → `elysium-build.js`, byte-identical round trip = the B1 gate) |
| `elysium-server.js` | the reference server (rooms, deals, relays, HTTP intake, the bot statics route) |
| `ELYSIUM-PROTOCOL.md` | the client↔server contract; `test-protocol-doc.js` lints it against the live handler tables |
| `elysium-test-harness.js`, `test-*.js`, `elysium-soak-hotseat.js` | the suites and the soak; `test-bot-canary.js` is the bot project's file, identical in both halves |
| `check-versions.js` | version lockstep across code + doc headers; in the monorepo it also asserts that every root file is a byte copy of `client/<name>` or (the eight bundle files) `bot/<name>` |
| `embed-help.js`, `help-local-server.html` | the Help-page embed tool and our Local-server authoring source (the bot project's `START-HERE-BOTS.html` is embedded verbatim) |
| `start-elysium*`, `start-cloudflare-tunnel*`, `START-HERE.html`, `Elysium_-_Host_Guide.docx`, `build-host-guide.js` | the download's launchers and guides |
| `elysium-error-digest.js`, `elysium-digest.service`, `elysium-digest.timer` | the ops digest (Discord) and its systemd units |
| `docs/` | the living docs (journal, context, learnings, CHANGELOG, PROJECT-MANIFEST), ops (runbook, hosting plan, security manifest), the plans, `kodarkivering.md`, and `handoffs/` — our replies to the bot project |

## The bot bundle beside the suite

The suites' LIVE tests, the canary, the soak and the Help-page drift check read the released bot files from
**beside** them. The bundle lives at the repository root (the download) and in `bot/`; copy it in before running
the gates and never commit it here (`client/.gitignore` keeps it out):

```
cd client && cp ../elysium-bot.js ../elysium-cardfx.js ../elysium-cardfx.json ../elysium-twd-profile.js ../elysium-twd-profile.json ../elysium-twd-archetypes.js ../elysium-twd-archetypes.json ../START-HERE-BOTS.html .
```

## Deploy = copy to the root

The root is the download. A client release copies `elysium-vtes-bord.html`, `elysium-server.js`, the start scripts,
`START-HERE.html` and the host guide from here to `/`; `node check-versions.js` (run from `client/`) fails until the
root matches. Nothing at the root is edited in place. The bot bundle at the root is the bot project's release —
consumed, never edited here (`docs/PROJECT-MANIFEST.md` §E2 records the consumed version).
