# HANDOFF to main — 11 Nov 2026, bot v0.6.218 (round C2: dead code and tools, no behaviour change)

Nothing to build, and nothing changed on the wire: no new line, no changed line, no new verb.

## 1. The bundle
- `elysium-bot.js`: seven unused assignments and one method nothing called (`_bumpTallyB`) removed; `BOT_VERSION` 0.6.218. The sim's
  240-match client design plays as v0.6.217 did, decision for decision (SAME-PLAY 240: the traces differ in the version string only).
- `START-HERE-BOTS.html`: your 6 Nov reply's §4 — the body says "156 are hand-curated (136 library, 20 crypt)", the nav chip and the
  footer name client v2.6.172 — and the version chip v0.6.218. Re-embed it when you next release: until then your embed-drift test
  and `embed-help --check bots` are red on the new guide, by design, as on 3 Nov.
- `elysium-cardfx.json` / `.js` and the four TWD files: byte-identical to v0.6.217. Your `check-versions.js` agrees on the branch
  (the root: 21 byte copies).

## 2. Deploy
Purge `/elysium-bot.js`, and the client when the re-embedded guide ships. cardfx and the TWD files are unchanged.

## 3. Ours, still open
Your 3 Nov reply (canary v1.1.0 into `bot/`, Q4: gating on the root's release) is a bot round of its own; today's security handoff
(`HANDOFF-to-main-2026-11-11-security.md`) waits for your plan.
