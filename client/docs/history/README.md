# docs/history — where main's frozen records went (27 Nov 2026)

The repository is public and carries no chat quotes and no names of private persons (the bot project's RULINGS D-141; the
owner's scope for main's half, 26 Nov 2026). Main's cumulative records were written before that rule, so the cleanup round
(client v2.6.190 / srv-2.6.54) moved them, whole and verbatim, to the private data repo `dtagent2000/VTES-Elysium-data`,
folder `client-history/`, as they stood on main at `a94072b`. The public files started again from there. Git history keeps
the old text too, by the owner's choice.

What moved:
- `docs/elysium-session-journal.md`: 190 entries, 4 Aug to 26 Nov 2026 → `client-history/elysium-session-journal-2026-11-26.md`.
- `CLAUDE.md`: the 274 release entries above "What Elysium is" (24 Jul to 26 Nov 2026) → `client-history/CLAUDE-2026-11-26.md`.
  The reference part stayed here.
- `docs/elysium-project-context.md`: the 214 release entries above the protocol note (24 Jul to 26 Nov 2026) →
  `client-history/elysium-project-context-2026-11-26.md`. The reference sections stayed here.
- `docs/START-HERE-CLIENT-CHAT.md`: the version table's release chain, the deploy notes of v2.6.172–v2.6.189 and the
  "Open after …" sections → `client-history/START-HERE-CLIENT-CHAT-2026-11-26.md`. What was still open moved, in our own
  words, into the new file's "Carried from before".

What stayed public: every release note since v1.4 (`docs/elysium-CHANGELOG.md`), the learnings, the plans, the replies to the
bot project, the protocol and the code. Where one of them quoted the owner or named a player, the round rewrote the line in
our own words with the owner by role; the words it took out are in the data repo's `client-cleanup-2026-11-27-words.md`, by
file and line on `a94072b`.

How the old references read now:
- "journal: NAME" (in the CHANGELOG, a reply or a code comment): the entry `## [NAME]` in
  `client-history/elysium-session-journal-2026-11-26.md`.
- "the vX.Y.Z entry" or "the DD Month entry" of `CLAUDE.md` or the context doc: `client-history/CLAUDE-2026-11-26.md` or
  `client-history/elysium-project-context-2026-11-26.md`.
- "START-HERE, Open after vX": `client-history/START-HERE-CLIENT-CHAT-2026-11-26.md`.

To read them in a session, attach `dtagent2000/VTES-Elysium-data` read-only and open `client-history/README.md`.
