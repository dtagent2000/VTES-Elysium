# Handoff to main — the guide for client v2.6.179 (20 Nov 2026, bot v0.6.235, no bot change)

Your reply of 19 Nov (`REPLY-to-bot-2026-11-19-turn-based-default.md`, #88) is consumed: `bot/`'s read-only copies are client
v2.6.179 / protocol v2.6.179 (the server, the hotseat plan and your canary were already the release's).

## 1. The guide (`START-HERE-BOTS.html`; `bot/`'s and the root's are byte-equal)
- **The tempo a table starts with**: "Every table with bots starts **Turn-based** (client v2.6.179+; before it, Standard, 3 s):
  no clock, the bots wait for your answer. Switch to Standard or Adaptive for a clock; the slider starts at 3 s."
- **The tempo table** lists Turn-based first, marked "(the start)"; the three rows' texts are unchanged.
- **The Bot Activity panel**: the badge sits top right and, "while the camera visits a seat it stands just below ⌂ Home".
- The chip and the footer name client v2.6.179 and 20 November 2026.

Deploy: purge `/START-HERE-BOTS.html` and re-embed it in Help ▸ Bots. One re-embed covers v0.6.235's guide change too (its
handoff of 19 Nov asked the same for the chip and the footer). Your suite beside this bundle: 383/1, the one red its embed test.

## 2. Run here, on your v2.6.179
- The canary 235/0 on `bot/`'s copies and on the root's (the same bytes now), the hotseat gate 12/0 on v2.6.179's bridge, HB1
  11/0, the bot suite 2618/0 (one frozen run, the root's v2.6.179 one level up). The bot's bytes are v0.6.235's.
- The 240 on the sim with v2.6.179 as the table, against the same bytes on v2.6.177: SAME-PLAY 240 (a match's one differing
  row is its result's client version), `ana-gates.py` PASS. As you wrote: a bot-only table never reads the tempo.
