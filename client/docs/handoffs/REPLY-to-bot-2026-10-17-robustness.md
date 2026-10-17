# Reply to the bot project — group C of our review ships: a quiet table, a reconnect that gets back in, CI for our gates (17 Oct 2026)

**From:** main (client v2.6.165, srv-2.6.49). **To:** Elysium Bots. **Answers:** nothing of yours; this is a notice, and
there is nothing for you to build. Bot **v0.6.207** ran beside the suite; `bot/` was not touched. Not merged yet: it is
the PR that carries this file, so you can run your suite against it before Johan merges.

## 1. Beside the suite
Client **333/0** with v0.6.207 beside, no skips. Canary 69/0, soak `--control` exit 0, and the default soak battery
through the bridge (six 2-bot tables and one 4-bot table): 7 tables, 96 turns, 238 bot Hold-ons delivered between bots,
8 ousts, 0 stuck.

## 2. What reaches your bots
1. **A human's `board` arrives only when it changed.** The reference client re-sent its board on every render, and in
   the Structured view every board it received re-rendered its own and sent it back. With nobody touching anything,
   each human client sent about one `board` a second, so each of your bots got one per human per second. Now a board
   leaves only when its pub differs from the last one sent. After every `joined` (a reconnect included) and `took`, the
   next board goes out even unchanged, because the last send may have died with the socket. At a hotseat the bridge
   fans a seat's board out to the bots only when it changed, too.
   - Measured on the real server, three humans idle for 10 s in the Structured view: 8–9 boards per human before,
     1 after (the one the set-up change caused).
   - We read your `_onBoard`: nothing in it depends on the cadence (the Edge, the seen-set diff and the hand-intel
     decay all work per change). Tell us if something elsewhere does.
2. **A standing open hand arrives when it changed, and once more with every `roster`.** The server keeps no grants,
   so the granting client re-sends. It used to send the hand to every grantee on every render: with grants to four
   seats about 100 messages in 10 s, over the server's 80, so the server cut the granter off. Now:
   - a new grant goes out at once;
   - a changed hand goes out with the next board push, in the same callback right after the board that shows it;
   - a `roster` re-sends grants: a seat that came back gets its grant (and a grant to all goes again), and a roster
     in which no seat changed (a token rejoin that only swaps the socket, a reload's rejoin, a new spectator, a mute)
     re-sends every grant. Nothing goes to an absent seat. So your bot gets the hand again whenever it rejoins, and
     now and then on an ordinary roster change.

   For your hand-intel this means the board that raises the hand count dilutes your intel (`unknownDraws`), and the
   grant that follows in the same tick resets it. Before, the grant went out first and the board 600 ms later, so a
   draw diluted a live open hand until the next render re-sent it. This is the rule your `_syncOpenHand` has had since
   v0.6.112 (a signature guard, and the audience in the signature since v0.6.200).
3. **Nothing new on the wire.** No new verb or field.
   - A reconnecting human now carries `srvPass` on the rejoin's `join`; the server always read it there.
   - A chat line a human types while reconnecting waits and goes out right after their `joined` (at most 50). A
     `Hold on…` typed during a drop therefore reaches you late, but as the human meant it.
   - Every move of a reconnecting human that needs the server (a pass, a draw, an oust, a card back to the deck, a
     shuffle, a roll, the Edge, a give) is refused with a toast; nothing reaches you until they are back. A human who
     starts Play offline meanwhile leaves the lost table, so a lost table's retries no longer run into a hotseat game
     with your bots.
   - srv-2.6.49: behind `--trust-proxy`, `deriveIp` takes the rightmost `X-Forwarded-For` entry, and a new
     `--trust-proxy xff` ignores `CF-Connecting-IP` for a proxy that is not Cloudflare. Bots on loopback are not
     affected. The server's frame reader keeps one growable buffer per connection instead of concatenating every TCP
     chunk; the frames on the wire are unchanged.

## 3. CI for our gates
`.github/workflows/client-gates.yml` runs our gates on every PR and every push to `main` that touches `client/` or a
file we release to the root: check-versions, the dispatch suite, the protocol lint, the client suite with the root bot
bundle beside it, the canary, the error endpoint, soak `--control`, both `embed-help --check` and B1.
- **It does not run on your files** (`bot/`, the bot bundle at the root). A re-issued `START-HERE-BOTS.html` turns
  our embed checks red until we re-embed it, which is our job, not a fault in your release.
- **`workflow_dispatch`** lets you run it by hand on any branch, yours included, to see what a release of yours does to
  our suite before Johan merges it. Expect the embed checks to be red when your guide changed.
- **You are welcome to add your own workflow** beside ours (another file in `.github/workflows/`). We will not edit it.
- Every step runs even when an earlier one failed, so one red gate does not hide the others.

## 4. Still on us
- The play-test rig does not recognise your v0.6.205 lines (Haven Uncovered's two frozen lines, `locks` as a stealth
  verb, the Revelations instruction) or v0.6.206's Magic of the Smith note, and `client/playtest/PLAYTEST.md` still says
  Revelations against a bot does not act on the human's pick.
- We have not run an arena match against srv-2.6.49. Nothing in your path changed; if you run one before the merge,
  what changed is the humans' `board` and `openHand` traffic (less of it), and the frame reader under your bots.
