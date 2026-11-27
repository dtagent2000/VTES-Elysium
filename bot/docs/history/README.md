# docs/history — the frozen records (26 Nov 2026; 27 Nov 2026: the documentation diet, RULINGS D-145)

Nothing here is edited or checked for staleness: a record is read as it stood. Two places hold them.

**Here, public** (written under D-141, so they stay in the repository; D-145):
- `elysium-bot-CHANGELOG-to-v0.6.243.md`: the CHANGELOG's entries of 9 Sep – 27 Nov 2026, verbatim. The working CHANGELOG
  starts with the documentation diet.
- `RULINGS-2026-11-27.md`: the register as it stood before the diet, verbatim: each line's build story, sources and examples
  that the standing register no longer carries (it keeps the rule).
- `specs/`: the delivered round specs, verbatim: V5 waves 2–6, the bench round, the Jack burn, a human's Grand Ball and
  the memo, the Banu Haqim pilot. A reference to `specs/spec-v5-wave…`, `spec-bench-round-…`, `spec-jack-burn-…`,
  `spec-human-ball-memo-…` or `spec-sweep-pilot-…` (in the code, the cardfx notes, a report or a handoff) means this folder.
- `handoffs/`: a consumed handoff to main moves here (HARNESS, "When main must act").
- An archived line or page (one in, one out, D-145) moves here, to `archive-<page>.md` under its id or heading.

**In the private data repo** `dtagent2000/VTES-Elysium-data` (D-142): the records written before D-141, which carry chat
quotes and names, moved verbatim to its `bot-history/` (main at `2f18daf`): the session journal, the project context, the dated
learnings, `SKILLS-2026-10-20.md`, the old bootstrap `CLAUDE-v2-2026-10-20.md` (its version handshake and debts 1–71) with
its extraction checklist, the version handshake v0.6.112–v0.6.211, every READ-ME-FIRST (`readme/`), the consumed handoffs and
main's replies of that time (`handoffs/`), the delivered round specs of that time (`specs/`: spec-cards, spec-next, spec-r4,
spec-home-pricing), the old `docs/archive/` (`bot-history/archive/`) and the 14 July cardfx design log
`cardfx-persistent-lock-design-decisions.md` (Swedish). Git history keeps the old paths as well. How those references read:
- RULINGS' "CL n" and a code comment's "CLAUDE.md debt N" (or 64a, 65f …): `bot-history/CLAUDE-v2-2026-10-20.md`; its
  extraction checklist says where each debt went.
- "journal", "READ-ME-FIRST", "context", "learnings": `bot-history/`.
- A pre-26 Nov `history/specs/…` or `history/handoffs/…` (spec-cards, spec-next, spec-r4, spec-home-pricing, the handoffs
  before 26 Nov): `bot-history/specs/…` and `bot-history/handoffs/…`.
- `cardfx-persistent-lock-design-decisions.md` (a spec's or a code comment's §n): `bot-history/specs/`.
