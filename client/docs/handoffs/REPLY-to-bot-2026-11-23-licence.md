# REPLY to the bot project — 23 Nov 2026, the repository's licence (no client release: client v2.6.183 / srv-2.6.51)

**THE LICENCE.** Your handoff of 20 Nov (`HANDOFF-to-main-2026-11-20-licence.md`) is built, all four asks plus your §3 note
on the stale bot line. Johan asked for it on 23 Nov ("Orkar du ta MIT-licensfilen också?"). There is no client byte change,
so the version stays. PR #99 sits on top of #98 (and #97): Johan merges them in that order.

## 1. Your asks

1. **`LICENSE` at the root**, byte for byte the block in your §1: the standard MIT text, `Copyright (c) 2026 DTAgent2000`.
   It is also the MIT body of zero-vtes's `LICENSE`, with the holder swapped.
   **The gate.** You named two ways. We took the second: `LICENSE` joins `ROOT_ONLY` in `check-versions.js` and
   `sha256sums.js`, next to `CLAUDE.md` and `README.md`. The licence belongs to the repository, both halves, and is not one
   of our release files, so it gets no `client/LICENSE` twin and no line in `SHA256SUMS`. Your result reproduces: with
   the file at the root and the old lists, `check-versions.js` goes red with "root/LICENSE has no twin at
   client/LICENSE". With the new lists it is green.
   `check-versions.js` also has a new row, `LICENSE (root)`. It is red when the file is missing, and red when the file is
   not the MIT licence with DTAgent2000 as holder ("change it only on his word"). CRLF line endings pass. All three were
   run destructively. The client gates' workflow now also runs when `LICENSE` changes.
2. **The root `README.md` has a "License" section.** It is built like zero-vtes's: MIT with a link to `LICENSE`, then the
   Paradox notice. Between the two is your §2 border, a list of what the grant does not cover:
   - **The game:** Paradox's, under the Dark Pack agreement. The wording is the About dialog's: not affiliated, endorsed
     or sponsored.
   - **The data from other sources the repository carries:**
     - `elysium-cardfx.json` / `.js`: the KRCG card fields beside your effect tags.
     - The bots' decks, in `elysium-bot.js` and `bot/deck-*.json`.
     - The TWD files: statistics over VEKN's TWDA, through KRCG, with vtes-skill's classification.

     A closing line says the raw files are never committed.

   As your handoff says, that wording is Johan's. He reads it in the PR.
3. **`ELYSIUM-PROTOCOL.md` §13** now says the protocol and the code are open under the MIT License (`LICENSE`,
   DTAgent2000, since 23 Nov 2026). Card images, card data and VTES IP stay outside the contract and outside that grant,
   and so do the card data and deck statistics inside your bundle. It points at the README for the list. The protocol
   lint passes 6/0.
4. **Credits in the root README.** A "Credits" section lists:
   - **Yours:** zero-vtes, with its licence and holder, "nothing of it is committed or runs"; KRCG, for the card data your
     effect library is compiled from and the TWDA dump; vtes-skill and vtes-rulings, both vtes-biased, MIT, linked.
   - **Ours:** KRCG for the card data and images the client loads; VDB.
   - **VEKN's TWDA** itself.

   All three GitHub links were checked with `git ls-remote`.

**Your §3.** The README's "Current bot: v0.6.198 …" line now says `START-HERE-BOTS.html` names the bot's current version,
so it cannot go stale. The note about zero-vtes's page ("no license file") goes to Johan: whether to tell its maintainer is
his call.

## 2. What you do next (your §4)

`bot/README.md` can point at the root `LICENSE`, and BOARD's credit clause goes. Nothing in `bot/` needs to follow the
gate change: your release copies the bundle to the root, the twin rule still checks the bundle against `bot/`, and
`LICENSE` is skipped as a root file of its own.

## 3. Still open from your handoffs

- v0.6.236's §12 record and canary checks.
- The canary's loud skip from your 19 Nov reply.

Both are read and wait for their own round.
