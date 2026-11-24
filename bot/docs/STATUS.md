# STATUS — Elysium Bots (rewritten at every release; 24 November 2026)

**Bot v0.6.237** (24 Nov 2026, the playtest round) · arena v1.4.16 · sim table v1.1.0 · cardfx compiler v1.11.4, curated 218 ·
hotseat tool v1.4.1 · coverage tool v1.1.55 · card ledger v1.2.2 · review sheet v1.0.1 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51 and main's
canary v1.5.0; the root's release is client v2.6.186 / srv-2.6.53 (the canary's second run).

**Deploy state:** `main` carries v0.6.236 and client v2.6.186. **Open PR:** #103, the playtest round (branch `bot-playtest-fixes`,
v0.6.237; RULINGS D-136), reviewed in three egress passes. Its handoff to main: `docs/handoffs/HANDOFF-to-main-2026-11-24-v0.6.237.md`
(the bot panel's bounce line and its timing, the re-announce's second sender, Fame's give and owner, the lock clones, the guide to
re-embed, a `resolve-late` label), and answers main's reply on the bot ring (PR #102, v2.6.187: its canary 247/0 on
v0.6.237).

## Last gates (v0.6.237's release bytes, `00ed0cbd`)
24 Nov: the suite 2785/0 ×3 · canary 235/0 ×2 (the copies; the root's v2.6.186), main's v1.6.0 with the ring's v2.6.187 247/0 ·
hotseat 12/0 (with v2.6.187 too) · HB1 11/0 · lint clean · main's client suite 409/1 (the guide's embed) · section 183 52/0
(49 red on v0.6.236) · the 240 against v0.6.236: DIVERGED 136, SAME-PLAY 104, every divergence the spread's (`spreadIncome=0`: SAME-PLAY 240); 0 of 1,191 income placements stacked while a ready vampire
had none (252 of 1,189 at 0) · `ana-gates.py` PASS 6/6 on the 240 · the arena smoke (one match, the four starters, real clock)
PASS 7/7 · the mirror bench (D-93's prediction, 480 paired): the stacking seat +0.01 VP (SE 0.02), the prediction held.

## Next
1. **The chat round** (BOARD; D-136): O-50 to Johan first (bot-to-bot exchanges as short bubbles or log only); then the recorder
   and a chat analysis tool, one speaker at a time, the chat lines ruled with him. The human's bleed-total window (`askHumansTotal`, C5) belongs
   near it: after a No block a bot with no modifier resolves in 150 ms, so a human bounces in the Block? window.
2. The sweep register (D-135): its active entries (7.1, 7.2, 8.3, 8.11 found in this round: Dreams of the Sphinx hosted, 1 pool
   every unlock; 11.1; the missed options if Johan says so), class 1 (R-47).
3. When v2.6.187 ships: the guide's hub, ring and bot box (main's ask 2), the read-only copies refreshed.
4. **C**, concentrated (spec-card-sweep §11.8, D-132): C1 the cross-check tool, then the first reader's round (§11.6).
5. Johan, asked 20 Nov (no kör yet): the pilot's flow proposals; the D line on KRCG's MCP; deleting `bot-sweep-pilot-fix2`;
   BOARD's read-through; D-135's next release (active entries only, or the missed options too); class 1's design question.
6. The fizzle misread; Q4; C5; C6 (the suite's 6 GB heap first); the abstract model.

## Not yet consumed from main
Client v2.6.187 (PR #102, open: the bot ring): its reply is answered in v0.6.237's handoff; the guide and the copies when it
ships (Next 3). Handed to main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip
loudly, token `SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128), v0.6.236's lines
(20 Nov), v0.6.237's (24 Nov).
