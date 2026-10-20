# Elysium Bots — delivery 16 October 2026 (d): bot v0.6.202 → **v0.6.203** (the first step of R3) — DEPLOY CANDIDATE

**What it is.** Johan merged v0.6.202 (PR #19) and main shipped client v2.6.159–161 meanwhile. His "Kör på!" of 16 Oct set the order: consume main's replies, then the vanished-bleed fix as R3's first step (own commit, own section, the ledger's `VANISHED` at 0), then R3 proper. His answers to my R2 questions: the bots answer known strikes (the strike step in the rulebook's order between bots), fix Deep Song against a human, wait and see on a tempo lever for a watched bot-vs-bot combat, re-measure only with the smoke now (a larger series once every fix is in), and keep the Jack payment as it is. This PR is the first half (PR A); R3 proper (the clocks, the hold lines, the verdict wait, the spokesbot, the tempo levers) follows as v0.6.204.

## 1. Main's replies of 16 Oct, consumed (client v2.6.159, v2.6.160; v2.6.161 came with no reply)
- The read-only `elysium-vtes-bord.html` and `ELYSIUM-PROTOCOL.md` are client v2.6.161's (copied in; the server and the hotseat plan were already identical).
- `test-bot-canary.js` is main's copy: their §5 runs the client's Reduce line through our `L12.reduceBy` and a live `_onLog`, and pins the two DEBUG lines in PROTOCOL §12 — **69/0**.
- **The hotseat lift** (main's §6, which they found by running our tool): the bridge's `tallyIn` calls `tallyCombatMerge` / `AVR_CMB_KEYS`; our lift's context had neither, so a bot's combat tally threw (v2.6.129–158) or relayed its base fields only (v2.6.159+). `elysium-bot-hotseat.js` v1.2.0 cuts the three definitions beside the literal; one context builder, `bridgeIn(L)`. The hotseat gate's H11 pins it: **11/0**, the old lift 10/1.
- The guide: the Reduce row named (v2.6.159+), with main's hotseat sentence (⌂ Home first, a Hold on gives the time); the offline Edge clear (v2.6.159); the eye in Structured (v2.6.160); the Debug box note; client v2.6.161. And this release's own sentences: a bounce onto a human may be blocked (the bot asks), Deep Song's rushed vampire is asked first, the strike step between bots in order.

## 2. The vanished bleed (READ-ME-FIRST-2026-10-16c §6) — fixed
- **What it was:** a bot target holds its bounce for the bleed total; the actor's total window takes reactions only, and v0.6.114 refused every Block! there — the bounce's new target's too, though the bounce cards say "(that Methuselah can attempt to block)". The new target's pending stayed contested and it dropped the bleed on the actor's It resolves. 21 bleeds in R2's 12 smoke matches, 3 on v0.6.201.
- **The actor:** `_bouncedTo(seat)` opens the new target's block step in whatever window the bounce lands; the refusal stays for every other seat, and for everyone after a modifier (`_blockStepFor`). The open ask follows the bleed (`a.target`: status, the roster hook, the tempo's who); the old target's intercept goes back to 0 (the action's stealth stays); a human new target is told it may block.
- **The `through` emit moved to the resolution** (n = announced, `final` = what lands, `bounced`). Emitted when the first ask said 'no' — before the late windows — it closed the block counter (`_emit` writes mode null), so a late blocker's verdict read stealth 0 from a fresh counter; it committed the parked cost; and the ledgers saw a bleed go through that was then blocked.
- **The target:** a BOT actor's It resolves over my live attempt lands the bleed — a bot declares the verdict of every attempt it takes up before it resolves, so an attempt it never took up was refused or came after the window closed. A human actor is still asked ("A block was announced but never resolved…"). A bot actor's modifier closes my block step (a human actor may be out of turn: the old rule).
- **Pinned:** section 142 (16 assertions; one live table on the real server: Ann bleeds Tor for 2 at stealth 1 with Dominate Kine, Tor declines and bounces it to Ulla on the total, Ulla blocks with Enhanced Senses, Ann declares "Block: Stealth 1 vs Intercept 1 — block succeeds."). On v0.6.202: **6/10** (10 red; the guards — the refusal stays, the new target's Pass, the human actor — green on both).

## 3. The strike step between bots in the rulebook's order (Johan: "the bots answer known strikes")
- R2's handshake left the strike step simultaneous. Rulebook 6.4.3: "the minions first choose their respective strikes (the acting minion first, then their opponent)".
- Now the acting bot strikes first. The answering bot looks at that strike (`_awaitOppStrikePeek`: the line stays pending — the existing reads, "combat ends came first" and `_ceCtx`'s known strike, see it, and the consuming wait after its own strike takes it at once) and chooses knowing it:
  - their dodge: no strike card or steal into it — the hands, the card stays in hand;
  - a dodge against the strike that would empty or torpor it — `decide('combat-strike')` reads the known damage, steal and aggravated damage instead of the assumed 1 (crows land anyway and are left out);
  - no dodge against a strike for 0, their dodge or their combat ends.
- The acting bot waits at least the handshake's safety net for the answer (`_strikeWaitHs`), and none after its own combat ends — 141m caught the acting Ventrue waiting 2 s for a strike the answering Tremere no longer sends after a Majesty.
- **Pinned:** section 143 (an in-memory two-bot relay: a dodge first keeps the answerer's Roundhouse; a Roundhouse for 4 first is dodged at blood 3, where the assumed 1 struck and took 4 into torpor; a fist for 0 at long keeps the Dodge; the decision itself). On the pre-change bytes **1/10**.

## 4. Deep Song against a human
- "The target vampire is considered the acting minion during that combat." v0.6.202 read it for the bot handshake only; the human phase walk asked in the turn seat's order. One rule now, `_combatIActing(myVamp)`, for the handshake, `_phaseStep`, `_phaseDamage`'s row and the press-reply window: after a bot's Deep Song rush the bot asks the human first in every step. Pinned in 143e.

## 5. Hygiene from R2's smokes (observe-only checks) — and one more old bug the smoke found
- The bot's own prevent line (`X plays CARD: prevents N damage.`) is typed with the vampire's name: the generic shape matched it first and read `X plays CARD:` as the vampire, so the strike-vs-taken invariant never subtracted an opponent's Hidden Strength (all 6 'strike-taken' flags of the R2 smokes).
- The burn-for-pool and rescue notes reach the pool ledger: the bot's notes say `NAME (bot)` since v0.6.108, and the classifier expected one word (the Wider View drift +2).
- An equipment's pool cost writes a pool event (`_doEquip` paid silently); `_range` starts at 'close'.
- **Found by this release's own smoke:** a borne Murder of Crows and a played Carrion Crows are two damage sources and both land each round (the cards' rulings); the victim kept only the last announce (`_oppCarrionCrows` is an `opp-env` event — it carries the amount per source now). The invariant flagged it ('taken 2, my strike 1, crows 2').
- **Pinned:** section 144 (7; 1/5 before the hygiene, 144e red before the crows fix).

## 6. Not done here (for later)
- **A human's bounce of a bot's bleed** is still not read by the acting bot (older): the client writes the bounce card's play line with a pool target; the bots read a bounce only from the bot-emitted re-announce. Noted in the handoff (§3).
- **A second bounce by a bot new target:** a bot target holds its bounce for the bleed total, and the actor opens no total window after a bounce (it never pumps a bounced bleed), so a bot that is the new target cannot bounce onward. A strategy question for later, not a rules error.
- **A bot target's reduce card is played in its first window**, before the modifiers; after a modifier a declined target without a bounce says Pass at once (`_reactWindow`'s `p.declined && !bounce` shortcut). Whether a reduction should wait for the total, like the bounce, is a strategy question. Seen while reading for §2; older; not measured.
- The tempo lever for a watched bot-vs-bot combat: Johan's decision 3 — wait and see if players react.

## Gates
All from `bot/`, on the final bytes (`elysium-bot.js` fd91bd13…, `test-bot-logic.js` 50a27299…):
- `node --check` on every changed JS file (the bot, both hotseat files, the canary, the suite, the guide's script), `py_compile` on `ana-ledger.py`, `bash -n` on `tools/run-section.sh`.
- `test-bot-logic.js` **2077/0 ×3**, alone, detached (v0.6.202: 2043; +34 = sections 142–144).
- `test-bot-canary.js` **69/0** (main's copy, against the client v2.6.161 copy beside it).
- `diag-hb1-smoke.js` **11/11**.
- `test-bot-hotseat.js` **11/0** (H11 new; the v1.1.0 lift 10/1).
- `test-cardfx.js` not run: cardfx and the twd files are byte-identical to v0.6.202's.
- `client/check-versions.js` after the root copy: everything agrees (the root's 21 files, each a byte copy of `client/` or `bot/`).
- Destructive: section 142 on v0.6.202 **6/10** (its three guards green on both); section 143 on the pre-change bytes **1/10**; section 144 **1/5** before the hygiene, and 144e red (6/1) before the crows fix. 141m (an older section) caught the acting bot waiting 2 s for a strike the answering bot no longer sends after its combat ends — fixed before the final bytes.
- Beside main's current client (a scratch worktree of origin/main = v2.6.161, with this branch's `bot/` and root bundle laid over it): the client suite 300/1 (the one red = the embed drift: Help ▸ Bots still embeds v0.6.201's guide; a re-embed closes it), the client's canary 69/0, check-versions agrees.
- **The arena smoke** on the final bytes (seed 4003 — R2's final seed — 3 matches, 4 Expert bots: malkavian, tremere, nosferatu, ventrue; pool 30): no timeouts (11, 8 and 9 rounds; 233–278 s a match). `ana-ledger.py`: every bleed paired (55 equal), **VANISHED 0**, the combat names 104 right, dealt = taken in 99 rows and the 5 others explained (4 Hidden Strength; 1 Carrion Crows — the strike row's `dealt` carries no environmental damage), steal pairs 11 of 11 equal, creep 6 placed / 18 burns. `ana-combat2.py`: handshake integrity 112/0, range agreement 112/0, press agreement 86/0, no wait ran into the safety net. `ana-inv.py`: **0 flags** (R2's final smoke: 4). `ana-block.py`: no violation (205 actions, 49 blocked).
- The smoke before the crows fix (seed 4003 ×3): bleed 68/68 paired, VANISHED 0, the handshake 102/0, range 102/0, press 78/0 — and one invariant flag, 'taken 2, my strike 1, crows 2': the old crows bug of §5.

## For main
- Send `HANDOFF-to-main-2026-10-16-v0_6_203.md`: one new bot chat line (a question to a human new target after a bounce); the rig: a bounce onto you is now taken up, and after a bot's Deep Song rush the bot asks you first; the known gap of a human's bounce; main's replies consumed (canary 69/0, H11); the bundle.
- Deploy `elysium-bot.js` v0.6.203 and re-embed `START-HERE-BOTS.html` (their embedded copy is v0.6.201's). cardfx and twd unchanged.

## Next
R3 proper as v0.6.204 (the plan of `REVIEW-playtest-2026-10-14.md`, unchanged): a clock starts when its question reaches the wire (F3, F11); stale hold lines are dropped (F4); a verdict wait when a bot blocks a human without a card (F10); one spokesbot for table remarks (F2 — the pool question stays per bot); the tempo levers (a)–(d) of F12 / F13. Then R4 (the uncurated V5 masters, Revelations against a bot) and the scenario in main's rig with `--dir`, and a larger re-measure once every fix is in (Johan's answer 4).
