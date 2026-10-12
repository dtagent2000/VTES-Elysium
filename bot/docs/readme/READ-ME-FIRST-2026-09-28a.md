# Elysium Bots — delivery 28 September 2026 (a): bot v0.6.191 → **v0.6.192 ARCHETYPE LABELS** (explanation only) — DEPLOY CANDIDATE

**What it does.** From a seat's crypt clan and the library cards it has shown, the bot names the closest of 42 tournament archetypes (vtes-skill's reviewed classification × the TWDA). A label is **confident** only when the best archetype wins by a margin AND at least 85 % of the shown cards are typical of it; then the bot says it once at the table ("I read Johan's deck as Lawfirm (9 of 9 cards typical).") and traces it. Otherwise it keeps a **closest** read in the trace only. **No decision reads a label.**

**Why the gate.** The offline test (`REPORT-archetypes-offline.md`) showed the labels are 90 % right inside the classified world at 8 cards, but a plain margin is falsely confident on about half of the decks outside it (85 % of all decks). The coverage gate brings that down to about 1 in 10, at 98 % right for the labels it gives.

**Also in this delivery:** the TWDA profile rebuilt from 4,672 decks (the larger export merged: 134 newer decks, 82 from 2026).

**Gates:** suite 1749/0 ×3 (tests 127z) · canary 57/0 · hotseat 10/0.

**Deploy:** `elysium-bot.js` (v0.6.192) with `elysium-twd-profile.json` (rebuilt) and **`elysium-twd-archetypes.json` (new)** beside it. In the browser bundle the client hands both to the bot as `twdProfile` and `twdArchetypes`.

**Replace:** `elysium-bot.js` · `test-bot-logic.js` · `twd-profile.py` · `elysium-twd-profile.json` · `elysium-bot-CHANGELOG.md` · `CLAUDE.md`
**Add:** `elysium-twd-archetypes.json` · `twd-archetypes.py` · `REPORT-archetypes-offline.md` · this file

Knob: `arkChat: 0` silences the chat line (the trace stays).
