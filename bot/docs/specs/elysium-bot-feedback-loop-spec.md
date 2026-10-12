# elysium-bot-feedback-loop-spec.md — the two opt-in reports from human tables

*Drafted 18 September 2026 from Johan's ask: (1) a bot match log — the bot's data points, decisions, what it saw its opponents do, and the outcome — sent automatically after a bot game, opt-in, discarded after the match; (2) an opt-in post-match survey (fun, challenge, free text). Both posted as their own reports to the Discord channel, shaped to give Claude the best possible material for developing the bots. Status: DRAFT — most of the surface is the CLIENT's and the SERVER's (main project); the bot side is small.*

---

## 0. Why two reports, and why together

The arena tells us what bots do to bots. It cannot tell us whether a game against a bot was *good*. The two reports close that loop: the match log says what the bot saw and decided (the same trace the arena writes, now from a human table), the survey says how it felt. Joined by one `matchId`, they let a review say *"the shark that scored 2/5 on fun in match X is the one that governed instead of lunging on turn 6 — the human called it passive"*. That is the improvement material the arena cannot produce.

## 1. Report A — the bot match log

**Content.** Exactly the arena trace the bot already emits (`_emit` rows: manifest, decide, block-eval with the model reads, play/through/blocked, took-bleed, keep-blocker, snapshot, and — with the four layers — the per-layer lines and `ref`), plus an `outcome` row at the end (oust order, VP, rounds, reason) and the compact dossier rendered from it. Nothing the bot did not already compute; no hand contents of humans (the bot never sees them); no chat text from humans beyond the frozen L12 lines the bot parsed.

**Where the bot runs at a human table decides the plumbing:**
- *Node bot (server-side seat)*: it already supports `--trace`; add `traceSink: 'memory'` — rows buffer in RAM, flushed at `outcome`, then dropped. No file on disk at a human table.
- *Browser bot (hotBridge / HB0 channel)*: same buffer in the page; the flush goes through the SERVER (a relay endpoint), never straight to Discord — the webhook secret must not live in a browser.

**Opt-in.** A table setting (host-side, off by default): *"Send bot match logs to the Elysium dev channel after the game."* Shown when a bot is seated. The bot receives the flag in its `joined` (or the bridge's synthetic one) as `caps.report`. No flag → no buffer at all, not even in memory.

**Privacy.** Human player names are replaced by seat labels (`seat 1`, `seat 3`) before the flush; the bot's own name stays. The `matchId` is the server's room id + start time. The log is discarded from the bot's memory the moment the flush succeeds or fails.

**Format for Claude.** One Discord post per match with: a header line (`matchId`, bots by persona/deck, humans by seat, outcome, rounds, duration), the compact dossier as the message body (it is already written for review), the trace `.jsonl` as an attachment (1–2 MB per 5p match; gzip when > 8 MB), and the price referee line when cardfx data is present. The batch review scaffold reads it unchanged — one human-table match is a one-match series.

## 2. Report B — the post-match survey

**Content.** Two ratings and a text: *Var det roligt?* 1–5, *Var det utmanande?* 1–5, *Något du vill säga om bottens spel?* (free text, optional). Optional: which bot (when several) the answer is about. Asked once, after the game ends, only to humans who played against a bot; skippable in one click; never shown twice for the same match.

**Where.** Client (a small modal at game end) → server (relay) → Discord. The server attaches `matchId`, the bots' persona/deck/version, and the human's seat (not name). Opt-in is the same host setting as Report A, or its own — Johan's call (§5).

**Format for Claude.** One post per answer: `matchId · seat N · fun 4/5 · challenge 2/5 · "kändes passiv efter turn 6"` plus the header line from Report A so the two can be read together even when only one arrived.

## 3. Bot-side work (small)

- `traceSink: 'memory'` + flush at `outcome`; `caps.report` from `joined`; seat-label pseudonymisation of human names in the buffer.
- An `outcome` emit at match end (oust order, VP, rounds, reason) — the arena writes this in its own summary today; the bot needs it for a human table.
- Nothing else: the dossier and harvest already read the trace.

## 4. Server/client work (main project — a spec to hand over)

- The host setting(s) and their transport to the bot (`joined.caps.report`).
- A relay endpoint: accepts `{matchId, kind: 'trace'|'survey', body}` from a seated bot or a client, posts to the Discord webhook, keeps nothing.
- The survey modal; the `matchId` on the client's game-end event.
- Rate/size limits (one trace per match per bot; survey once per human per match).

## 5. Decisions for Johan

1. One opt-in for both reports, or two? (One is simpler; two respects a table that wants to help with logs but not be asked questions.)
2. Should the survey include *"which decision felt wrong?"* with the bot's last three `why` lines as options? It would give exact material — at the cost of exposing reasoning after the game (fine: the game is over).
3. Discord channel: one for both, or `#bot-logs` and `#bot-feedback`? For processing here, one channel with the two post shapes is easiest to hand over.

## 6. How the material comes back here

A Discord post → pasted or exported into a session → `gen-match-dossier.js` / `gen-trace-harvest.js` on the attachment → the review scaffold, with the survey line quoted in *Confidence notes*. Over time: a small table of `(persona, deck, fun, challenge)` per match is the calibration the persona filter (§4 of the persona spec, the `ref` Δ) is missing — the human's rating is the ground truth the arena cannot give.
