# docs/history — where the frozen records went (26 Nov 2026)

The repository is public and carries no chat quotes and no names of private persons (RULINGS D-141, D-142). The frozen records
that used to live here and in `docs/archive/` were written before that rule, so they moved, verbatim and complete, to the private
data repo `dtagent2000/VTES-Elysium-data`: this folder's files to its `bot-history/`, `docs/archive/` to its `bot-history/archive/`
(main at `2f18daf`). Git history keeps the old paths as well.

What moved: the session journal, the project context, the dated learnings, `SKILLS-2026-10-20.md`, the old bootstrap
`CLAUDE-v2-2026-10-20.md` (its version handshake and debts 1–71) with its extraction checklist, the version handshake
v0.6.112–v0.6.211, every READ-ME-FIRST (`readme/`), the consumed handoffs and main's replies of that time (`handoffs/`), the
delivered round specs (`specs/`: spec-cards, spec-next, spec-r4, spec-home-pricing), the archive's superseded manifests and TODOs,
and the 14 July cardfx design log `cardfx-persistent-lock-design-decisions.md` (Swedish; from `docs/specs/`, now `bot-history/specs/`).

How the references read now:
- RULINGS' "CL n" and a code comment's "CLAUDE.md debt N" (or 64a, 65f …): the data repo's `bot-history/CLAUDE-v2-2026-10-20.md`;
  its extraction checklist says where each debt went.
- "journal", "READ-ME-FIRST", "context", "learnings": the data repo's `bot-history/`.
- `history/specs/…` and `history/handoffs/…`: the data repo's `bot-history/specs/…` and `bot-history/handoffs/…`.
- `cardfx-persistent-lock-design-decisions.md` (a spec's or a code comment's §n): the data repo's `bot-history/specs/`.

From now on a consumed handoff still moves to `docs/history/handoffs/` here (HARNESS, "When main must act"); it is written under
D-141, so it stays public.
