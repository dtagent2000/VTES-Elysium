# STATUS — Elysium Bots (rewritten at every release; 24 November 2026)

**Bot v0.6.238** (24 Nov 2026, Dreams of the Sphinx) · arena v1.4.16 · sim table v1.1.0 · cardfx compiler v1.11.4, curated 218 ·
hotseat tool v1.4.1 · coverage tool v1.1.55 · card ledger v1.2.2 · review sheet v1.0.1 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51 and main's
canary v1.5.0; the root's release is client v2.6.187 / srv-2.6.53 (the canary's second run).

**Deploy state:** `main` carries v0.6.236 and client v2.6.187 (the bot ring, PR #102). **Open PRs:** #103, the playtest round
(branch `bot-playtest-fixes`, v0.6.237; D-136; its handoff `docs/handoffs/HANDOFF-to-main-2026-11-24-v0.6.237.md`), and on
top of it #105, Dreams of the Sphinx (branch `bot-dreams-fix`, v0.6.238; the register's 8.11, Johan's go of 24 Nov): #103 first.
Main's #104 (client v2.6.188: the ring at the pointer; no wire change) is open: merged first, STATUS's root line follows it.

## Last gates (v0.6.238's release bytes, `1cf70697`)
24 Nov: the suite 2792/0 ×3 · canary 235/0 ×2 (the copies; the root's v2.6.187), main's v1.6.0 247/0 · hotseat 12/0 · HB1
11/0 · lint clean · main's client suite (v2.6.187) 422/1 (the guide's embed) · section 184 7/0 (6 red on v0.6.237) · the 240
against v0.6.237: IDENTICAL 135, SAME-PLAY 9, DIVERGED 96, every divergence malkavian's first lock of Dreams; malkavian −0.10
VP/match (SE 0.06), the prediction held · `ana-gates.py` PASS 6/6. v0.6.237's gates: its CHANGELOG entry.

## Next
1. **The chat round** (BOARD; D-136): Johan on O-50 (24 Nov): the bubbles stay, the humans follow the play; whether shorter he
   asked Claude. Claude's answer (one speaker at a time, the content kept; the recording's cost +24 to +36 % of the time) waits
   for his kör. Then the recorder, the chat tool, the lines ruled with him. `askHumansTotal` (C5) belongs near it.
2. The sweep register (D-135): its active entries (7.1, 7.2, 8.3, 11.1), class 1 (R-47); 4.6's onward bounce counted, missed.
3. v2.6.187 consumed: the guide's hub, ring and bot box (main's ask 2), the read-only copies refreshed. And
   `test-cardfx` red on main's daily runs since 22 Nov (KRCG's data moved; no card change of ours): a round of its own.
4. **C**, concentrated (spec-card-sweep §11.8, D-132): C1 the cross-check tool, then the first reader's round (§11.6).
5. Johan, asked 20 Nov (no kör yet): the pilot's flow proposals; the D line on KRCG's MCP; deleting `bot-sweep-pilot-fix2`;
   BOARD's read-through; D-135's next release (the missed options too?); class 1's design question.
6. The fizzle misread; Q4; C5; C6 (the suite's 6 GB heap first); the abstract model.

## Not yet consumed from main
Client v2.6.187 (PR #102, the bot ring): its reply is answered in v0.6.237's handoff; the guide and the copies next (Next 3).
Handed to main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip
loudly, token `SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128), v0.6.236's lines
(20 Nov), v0.6.237's (24 Nov).
