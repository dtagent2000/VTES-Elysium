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
  KRCG's `vtes.json` **outside the repository** and pass `--vtes <path> --offline`. It is third-party data:
  never commit it, never host it.

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
node client/playtest/playtest.js resolve                              # the counter's Resolve: the verdict line
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
- **Turn-based**: turn the reflex off (`pol '{"on":false}'`); the bots wait for you. `give` is the play button
  beside the bot badge (it gives every waiting bot the word).
- Phrases by name: `say pass`, `say no block`, `say block`, `say hold on`, `say it resolves`, `say any blocks`.

## Your duties as the human

The client leaves the human's own values to the human (Johan, 14 Oct). The bots manage theirs. So:

- **Pay costs** yourself: a reaction's blood (Telepathic Misdirection), a master's pool. Nothing deducts them.
- **Take combat damage** off your vampires: the line "X takes N (loses P blood, now M)" is your report to the table
  and the bots; the card does not change (`menu X 'Tokens>Blood −1'`). Steals likewise.
- **Take the Edge** after a successful bleed (`edge`); a bot never hands it over on the wire.
- **Burn pool** for the other side's effects (Creeping Sabotage: `burn 1 Creeping Sabotage`), and the bleeds that
  land on you.
- **Book stealth and intercept on the counter**: play the card, then `chat +1` (or the total, `chat 2`).
- **When a bot blocks your action and needs no card, it waits for you without a clock**: add stealth or `resolve`.
- **Clear the played cards** after each action (`clear`), or the next card lands on a pile.
- A bot's hand cannot be looked at: Revelations [aus] has no effect against one (open in the handoff).

## What to watch (the checklist from 14 Oct)

Message order (a question after its own answer, a hold announced after the release), two bots answering one prompt,
the same remark from two bots, the lag between a wait and its question (the report measures it), whether Hold on
stops the bots' own plays, bot-vs-bot combat (a burst, then silence), bleed reductions, ranges and Immortal Grapple
between bots, stolen blood, the Edge, cards logged "(uncurated — adjust if needed)", turn-1 discards.

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
