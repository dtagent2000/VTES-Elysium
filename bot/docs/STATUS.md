# STATUS — Elysium Bots (rewritten at every release; 25 November 2026)

**Bot v0.6.240** (25 Nov 2026, the chat round) · arena v1.4.16 · sim table v1.1.0 · cardfx compiler v1.11.4, curated 218 ·
hotseat tool v1.5.0 · coverage tool v1.1.55 · card ledger v1.2.2 · review sheet v1.0.1 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · the chat recorder and `tools/ana-chat.py` v1.0.0 ·
the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51;
the root's release is client v2.6.188 / srv-2.6.53 (the canary's second run).

**Deploy state:** `main` carries v0.6.239 (#107) and client v2.6.188 (#104), merged 25 Nov; #104 changed no wire, so the
read-only copies needed no refresh for it. **Open:** this release (`bot-chat-round`, base main) and Johan's rulings on its chat
lines (O-51).

## Last gates (v0.6.240's release bytes, `e29c0185`, test `890067de`, cardfx `fe5f60bf`)
25 Nov: the suite 2822/0 ×3 · canary 235/0 ×2 (the copies; the root's v2.6.188), main's v1.6.0 247/0 · hotseat 12/0 · HB1
11/0 · lint clean · main's client suite (v2.6.188) 430/1 (the guide's embed) · the arena smoke PASS 7/7 · the 240 against
v0.6.239 DIVERGED 76 / SAME-PLAY 164, `ana-gates.py` PASS 6/6, with chatFloor 0 the same rows · the chat recording GATE PASS.
The predictions (D-93) and the footprint: the CHANGELOG.

## Next
1. **Johan's rulings on the chat lines** (O-51: every line and R1–R9; the verdict wait O-36): what he asks for is built next,
   with a recording before and after (`tools/chat-record.js`). `askHumansTotal` (C5) belongs near it.
2. The sweep register's other active entries (7.1, 7.2, 8.3, 11.1: D-135, D-137), then class 1 (R-47); the missed options
   (4.6's onward bounce among them) wait in their classes.
3. v2.6.187 and v2.6.188 consumed: the guide's hub, ring and bot box (main's ask 2), the read-only copies refreshed.
4. **C**, concentrated (spec-card-sweep §11.8, D-132): C1 the cross-check tool, then the first reader's round (§11.6).
5. Johan, asked 20 Nov (no kör yet): the pilot's flow proposals; the D line on KRCG's MCP; deleting `bot-sweep-pilot-fix2`;
   BOARD's read-through; class 1's design question.
6. The fizzle misread; Q4; C5; C6 (the suite's 6 GB heap first); the abstract model; the register's class 14 (14.4–14.7,
   latent); `ana-windows.py` and the floor (BOARD).

## Not yet consumed from main
Client v2.6.187 (PR #102, the bot ring) and v2.6.188 (#104, no wire change): the guide and the copies next (Next 3). Handed to
main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip loudly, token
`SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128), v0.6.236's lines (20 Nov),
v0.6.237's (24 Nov), v0.6.240's (25 Nov: the chat's shape; re-embed the guide).
