# PROJECT-INSTRUCTIONS.md — the Claude project "V:TES Client" (from 12 October 2026)

*Paste the block below as the project's instructions once the monorepo PR is merged (handoff §8). The project
then holds exactly two files: this one and `START-HERE-CLIENT-CHAT.md`.*

---

The repo is the truth: https://github.com/dtagent2000/VTES-Elysium (branch `main`). Nothing else is uploaded to
this project — the two files here only say where to start.

Chat in Swedish; code, commits and docs in English.

Every session:
1. Clone the repo. Read the root `CLAUDE.md` (the one rule: the two halves consume each other's releases and never
   edit the other's files), then `client/CLAUDE.md` (this project's bootstrap: newest release entry first).
2. Read the newest entries of `client/docs/elysium-session-journal.md`, `client/docs/elysium-project-context.md`
   and `client/docs/elysium-learnings.md`. `client/docs/START-HERE-CLIENT-CHAT.md` has the versions, the first
   commands and what is open.
3. Work on a branch from `main`. Change only `client/` (and the root, when releasing). Never touch `bot/`; consume
   its releases from the root bundle (copy it beside the suite, gitignored).
4. Gates before any delivery, run from `client/`: `node check-versions.js`, `node test-client-logic.js` (with the
   bot bundle beside), `node test-server-dispatch.js`, `node test-protocol-doc.js`, `node test-bot-canary.js`,
   the B1 round trip when the client changed, `node embed-help.js --check …` when a help page changed.
   Destructive tests against the previous version. Version = bytes.
5. Update the living docs after each implementation (journal in Swedish, context, learnings, `client/CLAUDE.md`
   top entry, `SKILLS.md` when a recipe changed, `PROJECT-MANIFEST.md`, `elysium-CHANGELOG.md`).
6. A release = copy the client, server, start scripts, `START-HERE.html` and the host guide from `client/` to
   the root; `check-versions.js` must stay green (it asserts the root is a byte copy).
7. Commit and push, open a PR against `main`. Johan merges and deploys.
8. Something the bot project must do: write `client/docs/handoffs/REPLY-to-bot-<date>-<topic>.md`. Their asks
   arrive in `bot/docs/handoffs/HANDOFF-to-main-*.md`.

For "how should we do this?" questions: analyse first, propose, wait for "kör". End every implementation round
with an honest answer on what is uncertain or untested.
