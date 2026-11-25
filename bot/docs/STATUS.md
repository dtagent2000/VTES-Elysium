# STATUS — Elysium Bots (rewritten at every release; 25 November 2026)

**Bot v0.6.241** (25 Nov 2026, the exactness round) · arena v1.4.16 · sim table v1.1.0 · cardfx compiler v1.11.4, curated 221 ·
hotseat tool v1.5.0 · coverage tool v1.1.56 · card ledger v1.3.0 · review sheet v1.0.1 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · the chat recorder and `tools/ana-chat.py` v1.0.0 ·
the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51;
the root's release is client v2.6.188 / srv-2.6.53 (the canary's second run).

**Deploy state:** `main` carries v0.6.239 (#107) and client v2.6.188 (#104). **Open:** #108 v0.6.240 (`bot-chat-round`) and
this release, stacked on it (`bot-exact-round`; merge #108 first, L-84); Johan's rulings on the chat lines (O-51).

## Last gates (v0.6.241's release bytes)
GATES-STATUS

## Next
1. **Johan's rulings on the chat lines** (O-51) and on the playtests' questions (the project's two playtest docs of 25 Nov,
   claude/playtest-claude-game1 and -game2: the bounce after "No block", voting as a human, the caller's last word, the resolution panel) and the pool floor
   (O-52): what he asks for is built next.
2. The fidelity pass (D-138, BOARD): the other 13 V5 decks' cards, a deck a round or with C's families; CARDS.md's `exact`
   column is the measure (the five starters: malkavian 55/77, nosferatu 51/77, toreador 68/77, tremere 58/77, ventrue 59/77).
3. The register's active entries 8.3 and 11.1 (D-135, D-137), then class 1 (R-47); the missed options wait in their classes
   (10.1 Faceless Night [OBF] among them, its own design).
4. v2.6.187 and v2.6.188 consumed: the guide's hub, ring and bot box (main's ask 2), the read-only copies refreshed; the canary case
   for v0.6.241's `BLOCKED_LOCK` line once main's §12 has it.
5. **C**, concentrated (spec-card-sweep §11.8, D-132): C1 the cross-check tool, then the first reader's round (§11.6).
6. Johan, asked 20 Nov (no kör yet): the pilot's flow proposals; the D line on KRCG's MCP; deleting `bot-sweep-pilot-fix2`;
   BOARD's read-through; class 1's design question.
7. The fizzle misread; Q4; C5; C6 (the suite's 6 GB heap first); the abstract model; the register's class 14 (14.4–14.7,
   latent); `ana-windows.py` and the floor; the steal-pair debt (BOARD: it failed the banuhaqim smoke's ledger once here).

## Not yet consumed from main
Client v2.6.187 (PR #102, the bot ring) and v2.6.188 (#104, no wire change): the guide and the copies next (Next 4). Handed to
main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip loudly, token
`SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128), v0.6.236's lines (20 Nov),
v0.6.237's (24 Nov), v0.6.240's (25 Nov: the chat's shape; re-embed the guide), v0.6.241's (25 Nov: the `BLOCKED_LOCK` line for
§12; re-embed the guide).
