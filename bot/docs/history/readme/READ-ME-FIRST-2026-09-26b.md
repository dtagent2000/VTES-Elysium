# Elysium Bots — delivery 26 September 2026 (b): bot v0.6.176 → **v0.6.178** (the event log, bookkeeping typed + review fixes) — DEPLOY CANDIDATE

**What changed.** The event log now also types the table's bookkeeping lines. Each one carries its change (delta), the new value where the line prints it, and the cause.

- **pool:** bleed results, costs paid, the Edge, oust bounties, Blood Doll, Creeping Sabotage, referendums
- **blood:** hunts, Hunting Grounds, grants
- **politics:** votes, referendum terms and results
- **table events:** phases, ousts, discards, unlocks, combat starts

**Measured.** In one match the untyped lines fell from about 1,700 to about 60, so 96 % are now typed. The rest are notes. There is a dev-only dump for this: set `ELY_EV_DUMP=file` to write the untyped lines to a file.

**Review fixes (v0.6.178).** The client's HTML entities (`&amp;` `&lt;` `&gt;`) are now decoded before any parser reads a line, so a name with & reads right everywhere. Tally events record only the fields that changed.

**Still observe only.** Players see nothing new, and no decision reads the log yet.

**Gates.** Suite 1727/0 ×3 · canary 57/0 · hotseat 10/0 · dump matches: handshake 10/10, names 10/10.

**Deploy:** `elysium-bot.js` (v0.6.178).

**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`.

**Next.**
1. The conservation invariants in real time (design Part 3), read from these events.
2. Phase B for combat: the decisions read from the log, and the loose fields go.
