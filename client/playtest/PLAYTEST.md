# PLAYTEST.md: play a real game against the bots, and measure it

*Written 14 October 2026 (client v2.6.158) after the first full play-test: Claude as the human with the V5
Malkavian starter, two Expert bots (Tremere, Nosferatu), 8 rounds, Standard 3 s then Turn-based. What it found
is in `client/docs/handoffs/REPLY-to-bot-2026-10-14-playtest.md` (the bots) and the journal entry of the same day
(the client, fixed in v2.6.158).*

A unit test checks one rule. A play-test shows the **flow**: whether the bots talk over each other, whether a
question gives a human time to answer, whether a decision looks odd, whether the table ever stands still. The rig
plays through the client's own code (the closures behind its menus, its phase bar, its drop path), records every
frame, and turns the recording into numbers, so the same game can be played again after a change and compared.

## What you need

- Node, and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`, or point
  `PLAYWRIGHT_MODULE` at an installed copy). A dev tool only: nothing here is part of a release.
- A folder with `elysium-server.js`, `elysium-vtes-bord.html` and the bot bundle beside them. The default is the
  repository root (the release). For an unreleased client use `--dir client` with the bundle copied beside the
  suite (`client/docs/START-HERE-CLIENT-CHAT.md` has the one-liner).
- The card database. With internet the client fetches it from KRCG as usual. Without (a sandbox), keep a copy of
  KRCG's `vtes.json` **outside the repository** and pass `--vtes <path> --offline`; a sandbox that cannot reach KRCG
  copies it from the private data repo `dtagent2000/VTES-Elysium-data` (root `CLAUDE.md`, 'Data that is not in git').
  It is third-party data: never commit it, never host it.

## Start

```bash
node client/playtest/playtest-rig.js --out /tmp/pt-run1 &          # add --vtes ~/data/vtes.json --offline in a sandbox
node client/playtest/playtest.js setup                             # scenarios/three-seat.json: room, deck, bots, tempo, start
node client/playtest/playtest.js ev 60                             # follow the table (waits for something that needs you)
node client/playtest/playtest.js st                                # your hand, your board, every seat, the bots' waits
```

`setup` takes another scenario file: the human's deck is `bot:<key>` (a bot project deck, read from `bot/`, never
written), a path to a deck text, or the text itself; the bots are listed in seat order with deck key and persona;
`tempo` and `reflex` are optional. Control port and server port: `--control` / `--port` on the rig, `CPORT` for
the CLI. Everything lands in the run folder: `timeline.jsonl` (all of it), `feed.txt` (what the human saw),
screenshots. `client/playtest/runs/` is gitignored for the default location.

## Playing a turn

```bash
node client/playtest/playtest.js phase unlock           # each phase in order; the client's confirmations are answered OK
node client/playtest/playtest.js phase master
node client/playtest/playtest.js play "Blood Doll" --on Ashley        # a master on a vampire (then a draw)
node client/playtest/playtest.js phase minion
node client/playtest/playtest.js play "Govern the Unaligned" --by Ashley
node client/playtest/playtest.js menu Ashley 'Actions>Bleed>Bleed 3'  # the frozen line the bots read
node client/playtest/playtest.js ev 20 2                              # the bot's Hold on, then Block! or No block
node client/playtest/playtest.js play "Lost in Crowds" --by Ashley    # blocked: add stealth...
node client/playtest/playtest.js chat +1                              # ...and BOOK it on the counter (the bot reads the counter)
node client/playtest/playtest.js resolve                              # the counter's Resolve: the verdict line (or `say pass`: the bot declares it, bot v0.6.204)
node client/playtest/playtest.js say it resolves                      # the bleed lands: the bot takes it
node client/playtest/playtest.js clear                                # the played action cards to the ash heap
node client/playtest/playtest.js phase influence
node client/playtest/playtest.js influence Meaghan 2
node client/playtest/playtest.js out Meaghan                          # an influenced vampire into play
node client/playtest/playtest.js phase discard
node client/playtest/playtest.js discard "On the Qui Vive"
node client/playtest/playtest.js pass
```

`play` picks the level the client's chooser offers first; `--alt Superior` presses the other button when the
dialog matches. `menu` walks any right-click menu by its labels (`Combat>Hand strike>1`, `Tokens>Blood −1`,
`Actions>Block`). `js '<code>'` runs anything in the page; `PT.*` in `playtest-page.js` are the helpers.

## Answering the bots

- **Standard and Adaptive** give a human seconds. A model answering through this rig takes 5 to 15 s, so the
  rig's **reflex** answers in your place, `delayMs` after the bot's question appears in chat (`anchor: "chat"`,
  what a human reacts to): `hold` says Hold on (then you decide), `no` says the plain negative, `none` lets the
  clock run. Set it per kind (`block`, `verdict`, `react`, `pq`, `combat`, `strike`, `vote`) and per bot:
  `node client/playtest/playtest.js pol '{"block":"no","byBot":{"Viktor":{"block":"hold"}}}'`. Only your own
  phrases and chat lines count as an answer. Say in the report which waits ended in your holds.
- **The clock starts with the question** (bot v0.6.204): while a bot's question is still queued its wait has no
  deadline (the panel shows the dash, and an early answer still counts); the number the question announces is the
  clock. The rig records when each clock starts (`askArmed`, rig v1.1.0) and the report prints it as `clock`
  (question → clock; negative means the clock ran before the question, as with bot v0.6.203 and older).
- **What the reflex answers** (rig v1.1.0):
  - In a combat it answers a step only after that step's own question. A late "Anything before range?" no longer
    anchors the maneuver step.
  - When no question has come after 6 s and the bot has not started the wait's clock, the reflex waits for the clock.
    Bot v0.6.204+ starts the clock when the question is sent, so the reflex no longer answers a question you have
    not seen.
  - Rig v1.0.0 did both, and on 16 Oct it answered three combat steps before their questions.
- **Turn-based**: turn the reflex off (`pol '{"on":false}'`); the bots wait for you. `give` is the play button
  beside the bot badge (it gives every waiting bot the word).
- Phrases by name: `say pass`, `say no block`, `say block`, `say hold on`, `say it resolves`, `say any blocks`.

## Your duties as the human

The client leaves the human's own values to the human (Johan, 14 Oct). The bots manage theirs. So:

- **Pay costs** yourself: a reaction's blood (Telepathic Misdirection), a master's pool. Nothing deducts them.
- **Take combat damage** off your vampires: the line "X takes N (loses P blood, now M)" is your report to the table
  and the bots; the card does not change (`menu X 'Tokens>Blood −1'`). Steals likewise.
- **Take the Edge** after a successful bleed (`edge`). A bot that takes it (bot v0.6.200+: a bleed of 1 or more) says so
  on the wire (`edgeTake`) and your client clears yours: online, and at a hotseat from client v2.6.159.
- **Burn pool** for the other side's effects (Creeping Sabotage: `burn 1 Creeping Sabotage`), and the bleeds that
  land on you.
- **Reduce a bot's bleed** with your reaction card, then say by how much (client v2.6.159):
  `menu <minion> 'Actions>Bleed>Reduce bleed −1'` (or `−2`, `−X…`). The bot (v0.6.201+) lowers its bleed, and a bleed of 0
  moves no Edge. Adjust your own pool by what landed.
- **Book stealth and intercept on the counter**: play the card, then `chat +1` (or the total, `chat 2`).
- **When a bot blocks your action, it asks you and waits on the tempo** (bot v0.6.204): "X blocks (stealth A vs
  intercept B) — you, add stealth, or say Pass to resolve it (3s → the block succeeds)". Standard counts the slider
  from that question; Turn-based has no clock (a reminder after two minutes). Answer with stealth (`chat +1`, or the
  counter: the clock starts again), `say pass` or `say it resolves` (the bot declares the verdict from the counter:
  combat when the block holds, its block window again when it fails, and after It resolves a failed block lets your
  action land), `resolve` (the counter's own verdict line), or `give` (the play button: the bot declares). The Bot
  Activity panel's row reads `block verdict (you)` with ▶ Declare verdict (client v2.6.162). The verdict bubble then
  names the bot, because the bot sent the line. A failed block leaves the counter open for the rest of the action
  (stealth stays in effect); your `say it resolves` or the next action closes it.
- **A bleed bounced onto you** (bot v0.6.203: another bot's Deflection-class card on a bot's bleed): the acting bot asks
  you ("X now bleeds you for N — you may block it (the bounce allows that), react, or say 'no'") and takes up
  your `say block`.
- **After a bot's Deep Song rush on your vampire** (bot v0.6.203) the bot asks you first in every combat step: the
  rushed vampire is the acting minion of that combat.
- **Clear the played cards** after each action (`clear`), or the next card lands on a pile.
- Revelations [aus] against a bot: it reveals its hand to you (online, and at a hotseat from client v2.6.159); it does
  not act on the card you pick yet (the bot project's R4).

## What to watch (the checklist from 14 Oct)

Message order (a question after its own answer, a hold announced after the release), two bots answering one prompt,
the same remark from two bots, the lag between a wait and its question (the report measures it), whether Hold on
stops the bots' own plays, bot-vs-bot combat (a burst, then silence), bleed reductions, ranges and Immortal Grapple
between bots, stolen blood, the Edge, cards logged "(uncurated — adjust if needed)", turn-1 discards.

**What should look different after bot v0.6.202–204** (re-run the 14 Oct scenario and compare):
- A combat between two bots is one line per bot per step ("— VAMPIRE does not maneuver.", "has nothing before
  strikes.", "does not press." when a bot plays nothing; the acting bot first), evenly paced while a human is seated:
  about 14 s for a silent round at 3.1 s instead of the 2 s burst and ~19 s of silence.
- A Hold on stops a bot's own combat moves too, and "⏸ Holding for …" / "▶ Resuming." come at the head of its queue.
- The deck-reading remark comes from one bot, once, in the log ("NAME (bot) reads <you>'s deck as …"), and in a
  combat with you the round summaries are log lines.
- "QUESTION AFTER THE WAIT CLOSED" should be gone for waits that ended on the clock, and the `clock` column near 0.
- No table stands still after a bot blocks you (the 14 Oct play-test: four minutes).

## After the game

```bash
node client/playtest/playtest.js quit
node client/playtest/playtest-report.js /tmp/pt-run1      # turns, pacing, waits and lags, double speech, combat silence, the bots' wait rows
```

The bots' findings go to the bot project as `client/docs/handoffs/REPLY-to-bot-<date>-playtest.md`, with the
timestamps; ours go to the journal and a fix round, each pinned by a test that fails on the previous client.

**Smoke check of the rig:** after `setup`, `node client/playtest/playtest.js smoke` plays the human's first turn and
waits for every bot's turn; it fails on a page error or a turn that never comes back (about two minutes).

## Caveats

- One tab: the human is also the host, as on elysium.cards. A second human needs a second rig (another port).
- The machine counts: the first run shared two cores with an image error loop and its timings before the fix are
  marked in the feed. Watch the load on a small box.
- With a client older than v2.6.158 and no internet, run `--offline`: the rig answers the card-back URLs itself,
  or the old error loop comes back.
