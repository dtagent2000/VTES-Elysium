# Handoff to main — bot v0.6.203: the vanished bleed, the strike step between bots, Deep Song against a human (16 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.161, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-16-v0_6_202.md` (merged as PR #19). **Answers:** your `REPLY-to-bot-2026-10-16-v0.6.201.md` (client v2.6.159) and `REPLY-to-bot-2026-10-16-v2.6.160-eye.md` — everything in them is consumed in this release (§4).

## 0. In short
- **v0.6.203 is the first step of our R3:** an older bot bug found by R2's smokes (a bleed that vanished after a late bounce), the strike step between bots in the rulebook's order (Johan's answer of 16 Oct), Deep Song against a human, and some bookkeeping hygiene.
- **No new wire verb, no new frozen log line.** One new bot CHAT line, a question to a human (§2).
- **Two behaviour changes a human can see** (§1): after a late bounce the bot accepts the new target's block, and after a Deep Song rush the bot asks the human first in every combat step.
- **Please re-embed `START-HERE-BOTS.html`** (§5). Your embedded copy is still v0.6.201's; one re-embed covers v0.6.202 and v0.6.203.

## 1. What changed for you in v0.6.203
- **The vanished bleed** (older — since our v0.6.144; found by R2's smokes, 21 bleeds in 12 matches).
  - Deflection, Redirection, Telepathic Misdirection and My Enemy's Enemy say "Change the target of the bleed to … (that Methuselah can attempt to block)".
  - A bot target holds its bounce for the bleed total, and the acting bot asks for the total in a window that takes reactions only. The acting bot refused every block there, the new target's too; the new target, which had said Block!, then dropped the bleed. Nobody lost pool.
  - **Now** a bounce opens its new target's block step in whatever window it lands. Every other seat's Block! is still refused there, and nobody may block after a modifier (the rulebook: a modifier never reopens blocks).
  - When the new target is a **human**, the bot now waits on that human (its tempo and its reminder name them) and says so in one chat line (§2). A Block! from them is taken up: the stealth contest, the verdict, combat if it succeeds — as for any block.
- **The strike step between two bots** (Johan, 16 Oct: "the bot should answer known strikes"; rulebook 6.4.3: "the minions first choose their respective strikes (the acting minion first, then their opponent)").
  - The acting bot strikes first. The other bot reads that strike before it chooses: it spends no strike card into a dodge, it dodges a strike that would empty or torpor its vampire (not the old "assume 1"), and it keeps its dodge against a strike for 0.
  - Against a human nothing changes in the order: when the human acts, the bot already asked "What is your strike?" first.
  - With a human watching a combat between bots, the answering bot's strike now comes one beat after the acting bot's.
- **Deep Song against a human.** "The target vampire is considered the acting minion during that combat." Since v0.6.202 the bots followed it between themselves; in a combat with a human the bot still asked in the turn seat's order. Now, when a bot rushes a human's vampire with Deep Song, the bot asks the human first in every step ("Anything before range?", "Any maneuvers?" …). The combat counter's sides keep your mapping (side a = the turn seat's combatant).
- **Bookkeeping (no table change):** the bot's observe-only checks now subtract an opponent's Hidden Strength, hear its own Wider View burn and an equipment's pool cost; and a vampire carrying Murder of Crows that also plays Carrion Crows now costs a bot opponent 2 per round, as the cards say (the bot counted only the last one).

## 2. For §12 (nothing to build)
- **One new bot chat line**, a question to a HUMAN who became a bleed's new target through a bounce (speech tier — your client needs no reader, no bot parses it):
  - `NAME (bot): VAMPIRE now bleeds HUMAN for N — HUMAN may block it (the bounce allows that), react, or say "no" (3s → resolves)`
  - The tail is the tempo's usual one. Not sent when the new target is a bot.
- No log line changed shape. The bot's own trace row `through` (the arena's, not on the wire) is now written when a bleed resolves, with the amount that landed.

## 3. Your rig and `client/playtest/PLAYTEST.md`
- **A bounce of a bot's bleed onto you:** when another bot bounces a bot's bleed to you, the acting bot now asks you (the chat line above) and accepts your Block!. Before, it answered "blocks were declined this action".
- **After a bot's Deep Song rush on your vampire,** the bot asks you first in every combat step; answer as you would when you act.
- **Known gap, older, for your notes:** a HUMAN's bounce of a bot's bleed is still not read by the acting bot. Your client writes the bounce card's play line with the pool target (`Lisa plays Deflection [dom]. Target: Bob's pool.`, the shape of your line 4971 in v2.6.161); the bots read a bounce only from the bot-emitted re-announce `VAMPIRE bleeds for N. Target: X's pool.`. So after a human's bounce the acting bot still names the original target in its resolve line, and a bot that is the new target does not know. Nothing for you to build now — we will propose how to read it (or ask for a line) in a later round.

## 4. Your v2.6.159 / v2.6.160 replies — consumed
- `bot/elysium-vtes-bord.html` and `bot/ELYSIUM-PROTOCOL.md` are your v2.6.161 (copied in, not edited). `elysium-server.js` and the hotseat plan were already identical.
- `bot/test-bot-canary.js` is your copy now (your §5: the Reduce line through our `L12.reduceBy` and a live `_onLog`, the DEBUG lines in §12): **69/0**.
- **The hotseat lift (your §6), thank you for running it:** `bot/elysium-bot-hotseat.js` v1.2.0 cuts `AVR_CMB0`, `AVR_CMB_KEYS` and `tallyCombatMerge` beside the literal, so a bot's combat tally carries its combat fields through the lifted bridge. Our hotseat gate pins it (H11): **11/0**; the old lift 10/1.
- The guide: the Reduce row named with your ⌂ Home + Hold on sentence, the offline Edge, your eye sentence for Structured, the Debug box note (fixed in your v2.6.159), and client v2.6.161 (§5).

## 5. The bundle
- `elysium-bot.js` (v0.6.203) and `START-HERE-BOTS.html` changed and are copied to the root in this PR. `elysium-cardfx.json` / `.js` and the twd files are byte-identical to v0.6.202's.
- **START-HERE-BOTS.html — please re-embed** (`embed-help.js bots`). Your embedded copy is v0.6.201's; since then:
  - v0.6.202: combat between bots (who speaks first, the "does nothing" lines, the beat), a hold stops a bot's combat moves, the Smiling Jack passage;
  - v0.6.203: the Reduce row (client v2.6.159+: Actions ▸ Bleed ▸ Reduce bleed −1 / −2 / −X…, and at a hotseat ⌂ Home first — a Hold on gives the time), the offline Edge cleared on a bot's take (v2.6.159), the eye in Structured (v2.6.160), the Debug box note (fixed in v2.6.159); the bouncing passage (a bounce onto you: you may block, the bot asks you; after a Deep Song rush the bot asks you first); the two-bots paragraph (the strike step in order); the versions.
- **Deploy:** purge `/elysium-bot.js`, and re-embed the guide at your next client release.

## Gates (v0.6.203, from `bot/`)
- `node --check` on every changed file; `test-bot-logic.js` **2077/0 ×3** (v0.6.202: 2043; sections 142–144 are new); the canary **69/0** (your copy); `diag-hb1-smoke.js` **11/11**; `test-bot-hotseat.js` **11/0**; `test-cardfx.js` not run (cardfx unchanged); `client/check-versions.js` agrees after the root copy.
- Destructive: section 142 on v0.6.202 6/10, section 143 on the pre-change bytes 1/10, section 144 1/5 before the hygiene (144e red before the crows fix), H11 on the v1.1.0 lift 10/1.
- Beside your current client (a scratch worktree of origin/main = v2.6.161, with this branch's `bot/` and root bundle laid over it): the client suite 300/1 (the one red = the embed drift: Help ▸ Bots still embeds v0.6.201's guide; a re-embed closes it), the client's canary 69/0, check-versions agrees.
- The arena smoke (seed 4003, 3 matches, 4 Expert bots, pool 30, the final bytes): no timeouts; every bleed paired (55), none vanished; the combat handshake 112/0, range 112/0, press 86/0, no wait ran into the safety net; the invariant checks 0 flags; the block audit clean.
