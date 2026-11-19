# REPLY to the bot project — 19 Nov 2026, client v2.6.178 (srv-2.6.51 unchanged, bot v0.6.234 beside)

**TURN-BASED FROM THE START.** Johan: a table with bots should start Turn-based. This is client-only, with no new verb
or field, and nothing in your bot or tools has to change. The PR follows #85 (v2.6.177); Johan merges.

## 1. What changed

- The client seeds a table's tempo, and the seed is now **Turn-based** (`BOTCFG_SEED = { tempo: 'turn', waitSecs: 3 }`).
  The 3 s rides along, so a switch to Standard or Adaptive gets 3 s. Before, the seed was Standard, 3 s (v2.6.139, the
  tempo spec's decision 3).
  - At a hotseat, `hotSpawnBots` stores the seed in the bridge before any bot joins, so each bot hears `botcfg` right
    after `joined`.
  - Online, the host's client sends it once, where the room has nothing stored (`botCfgSeed`).
- What did not change:
  - Nothing stored still means Standard, 3 s (`BOTCFG0`). That is the merge base your server copy and the bridge share,
    and it is what a bot that hears no tempo keeps.
  - A room that already has a tempo keeps it, a restored room included.
  - Any seated human can change the tempo in Bot settings, and the log says so as before.
- PROTOCOL §8 `botcfg` says this.

## 2. What it means for you

- **Your guide** (`START-HERE-BOTS.html`, embedded in our Help ▸ Bots) says: "Every table with bots starts at
  **Standard, 3 s**." From v2.6.178 that sentence is wrong. Something like "Every table with bots starts
  **Turn-based** (Standard and Adaptive use the slider, 3 s unless someone moves it)" would match. It is your text, so
  our Help shows the old sentence until you ship a new guide and we re-embed it.
- **Your tools and gates do not use the client's seed**:
  - `runTable` and the sim never send `botcfg`.
  - The soak seats no human.
  - Bot-vs-bot windows never read the tempo.

  So your series, the sim and the hotseat gate are unchanged. Your `--profile client` mirrors how the client paces its
  bots (paceMs 3100). It never mirrored the seed: no human sits at a sim table, so a tempo has nothing to wait on.
- **Turn-based against a human now happens at every new table**, so your reminder at 2 min and your go-on at 4 min will
  be met far more often than before.

## 3. Checked

- Client suite 383/0, with v0.6.234 beside. The new suite against v2.6.177 gives 379/4:
  - the two seed pins that changed;
  - the new seed test;
  - a LIVE test where your real bot, at a table seeded the way `hotSpawnBots` seeds it, waits on the human with no
    clock for 2.5 s. On v2.6.177 that wait had 2954 ms left.
- Five mutants caught, five of five.
- Headless Chromium, using the real Play offline dialog with one human and your bot:
  - Bot settings opens Turn-based, with the slider at 3 and greyed.
  - The bot's bleed asks "Block? — say "block" or "no" (no clock — I wait for you)", and no clock appears.
  - After ⌂ Home, the play button gives it the word ("reaction window closed from the table controls").

## 4. Found, ours (with Johan)

At a hotseat the sweep's camera visits the acting bot's seat. During that visit the 🤖 badge, with its play button,
lies under the visited seat's mat: the button is drawn, but a click lands on the mat. The human gets it back with
⌂ Home, or answers in the chat. It is the same on v2.6.177. With Turn-based as the start it matters more.

**Built in v2.6.179** (same PR, Johan's go): during a visit the badge stands above the seat, under ⌂ Home and
right-aligned with it. If your guide describes where the badge sits, it is unchanged in the home and helicopter
views and lower during a visit.
