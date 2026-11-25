# STATUS — Elysium Bots (rewritten at every release; 24 November 2026)

**Bot v0.6.239** (24 Nov 2026, hand size and replacement) · arena v1.4.16 · sim table v1.1.0 · cardfx compiler v1.11.4, curated
218 · hotseat tool v1.4.1 · coverage tool v1.1.55 · card ledger v1.2.2 · review sheet v1.0.1 · precon generator v1.1.1 ·
`krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.4 · the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51
and main's canary v1.5.0; the root's release is client v2.6.187 / srv-2.6.53 (the canary's second run).

**Deploy state:** `main` carries v0.6.238 and client v2.6.187 (#103, v0.6.237 with KRCG's data of 24 Nov; #106, #105's
commits). **Open:** #107 this release (`bot-hand-replacement`, base main); main's #104 (client v2.6.188, no wire change):
merged first, the root line above follows it. A merged PR's branch is deleted automatically (24 Nov).

## Last gates (v0.6.239's release bytes, after the egress review's pass 3, `6e29f566`, cardfx `fe5f60bf`)
24 Nov: the suite 2803/0 ×3 · canary 235/0 ×2 (the copies; the root's v2.6.187), main's v1.6.0 247/0 · hotseat 12/0 · HB1
11/0 · lint clean · main's client suite (v2.6.187) 422/1 (the guide's embed) · section 185 7/0 · the arena smoke PASS 7/7 ·
the 240 and the five starters' 120 IDENTICAL to the first bytes'; the lasombra smoke IDENTICAL to pass 2's (SAME-PLAY in its
12 cancels against the first bytes) · `ana-gates.py` PASS 6/6. The first bytes' 240 against v0.6.238 and the predictions
(D-93): the CHANGELOG.

## Next
1. **The chat round** (v0.6.240; D-137, Johan's kör): a recording first, then one speaker at a time (a short phrase holds the
   floor 1.5 s), no "(bot):" prefix, a bot's question to a bot without the human's tail; a recording after. The recorder and
   a chat tool in bot/tools. `askHumansTotal` (C5) belongs near it.
2. The sweep register's other active entries (7.1, 7.2, 8.3, 11.1: v0.6.241, D-135, D-137), then class 1 (R-47); the missed
   options (4.6's onward bounce among them) wait in their classes.
3. v2.6.187 consumed: the guide's hub, ring and bot box (main's ask 2), the read-only copies refreshed.
4. **C**, concentrated (spec-card-sweep §11.8, D-132): C1 the cross-check tool, then the first reader's round (§11.6).
5. Johan, asked 20 Nov (no kör yet): the pilot's flow proposals; the D line on KRCG's MCP; deleting `bot-sweep-pilot-fix2`;
   BOARD's read-through; class 1's design question.
6. The fizzle misread; Q4; C5; C6 (the suite's 6 GB heap first); the abstract model; the register's class 14 (14.4–14.7,
   latent: a draw in flight, a hand size lowered in play, a reaction's late release, a Sudden Reversal's window read late).

## Not yet consumed from main
Client v2.6.187 (PR #102, the bot ring): its reply is answered in v0.6.237's handoff; the guide and the copies next (Next 3).
Handed to main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip
loudly, token `SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128), v0.6.236's lines
(20 Nov), v0.6.237's (24 Nov).
