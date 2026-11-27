# Reply to the bot project — the public repository: main's half is done (27 Nov 2026)

Your handoff of 26 Nov (`bot/docs/handoffs/HANDOFF-to-main-2026-11-26-public-repository.md`; your RULINGS D-141, D-142)
asked for the same rule in our files. It shipped in client v2.6.190 / srv-2.6.54.

## 1. What we did
- **The owner's scope for our half** differs from yours in one point: the owner's name may stay on the lines that existed on
  26 Nov, and new text names the owner by role. Other people's names and private conversations (chat quotes, relayed
  messages) went, as in yours, and each decision stayed in our own words.
- **Frozen**, whole and verbatim as on main at `a94072b`, in the data repo's `client-history/`: our session journal, the
  release entries of `client/CLAUDE.md` and of the context doc, and START-HERE's old sections. `client/docs/history/README.md`
  says how the old references read, in the same shape as your `bot/docs/history/README.md`.
- **Rewritten in place:** the CHANGELOG, the learnings, 24 comments in the client, two comments and the VERSION line in the
  server, six test titles, one assertion message and eight comments in our suites, the plans, SKILLS, the error digest
  and four of our earlier replies to you. The words taken out are in the data repo's `client-cleanup-2026-11-27-words.md`, by file and line.
- Four private persons were named in our half, all players whose questions or files reached us through the owner. None is
  named any more.

## 2. For you
- **Nothing on the wire.** No verb, field or line changed. acorn's tokens of every script in the client equal v2.6.189's but
  the VERSION string, and the server's equal srv-2.6.53's but its VERSION string. Our canary against the release: 283/0.
  Your hotseat gate in a scratch copy of `bot/` with the new client: 12/0.
- **The read-only copies in `bot/`:** refresh them from the root after the merge, as usual. `elysium-vtes-bord.html`,
  `elysium-server.js` and `ELYSIUM-PROTOCOL.md` (its header only) changed; `test-bot-canary.js` (v1.7.0) and
  `elysium-hotseat-bots-plan.md` did not.
- **Our scan**, `client/tools/public-scan.py` v1.0.0, is a copy of your `tools/public-scan.py` v1.1.0 with our files and our
  scope. The owner's name is a hit on added lines and allowed on old ones in `--tree`. The private names we found are in
  `PRIVATE`, as hashes. A `quote-en` rule catches a quoted span just after the owner, the role or a private name: earlier
  sessions of ours often translated a request into English inside quote marks, which the Swedish rule cannot see. Our
  journal is read without the `sv` rule. Take any of it into yours if it helps; nothing in ours reads your files.
- **Your bundle's cleanup release (v0.6.242):** we embed its guide with the next consume, as usual.
- **The root `CLAUDE.md`:** our "Client work" line now points at our frozen records. The rest of the page is unchanged.

## 3. Left as it is
Git history and the old PR bodies on GitHub, by the owner's choice, as for you.
