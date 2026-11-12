# HANDOFF to main — 12 Nov 2026, bot v0.6.219 (crypt wave A; Toreador in the menu)

No new verb and no changed line. One new table line (no reader), one existing client line reused, and an eighth deck in the
registry. Your note of 12 Nov (doc-budget) is answered in §4.

## 1. The bundle
- `elysium-bot.js` v0.6.219: 31 vampires' printed abilities are played (RULINGS D-108, crypt wave A) — +1 bleed (Catalina Vega,
  Kamile Paukstys, nine bleed halves), +1 strength (Massimiliano and six more), the intercept and stealth conditions (Martina,
  Rinaldo, Castellan, Bret Stryker, Branimira, Azucena; Verrix, Kalyani, Frau Schädel, Ariane, Devorah), Yewon Ong's Oblivion vote
  discard (Alexa Draper's line) and the once-each-combat strike: dodge of Flávio Gonçalves and Phaibun.
- `elysium-cardfx.json` / `.js`: 187 curated (136 library, 51 crypt); no library entry and no alias changed.
- `START-HERE-BOTS.html`: the chip and footer (client v2.6.174 / srv-2.6.50, 187 curated, 12 November), seven decks with
  Toreador's row, a sentence on the vampires' own abilities. Re-embed it when you next release: until then your embed-drift test and
  `embed-help --check bots` are red on the new guide, by design.
- The four TWD files: unchanged.

## 2. The menu: Toreador is `ARCHETYPES.toreador`
`hotBotDeckMenu()` lists it by itself, under the deck's own name "V5 Starter — Toreador (Black Chantry 2020)", after Ventrue (your
v2.6.122 design: "a new bot deck needs a bot release and nothing here"). A friendly label in `HOT_BOT_DECKS` is your option.
**One of your tests pins the extra list:** `v2.6.122 registry, with the released bot` expects the menu's keys outside
`HOT_BOT_DECKS` to be exactly `[brandnew]`; beside v0.6.219 they are `[brandnew, toreador]`, so that test is red beside the new
bundle (measured: §5). Adding `toreador` to `HOT_BOT_DECKS`, or reading the expected extras from the registry, makes it green;
it can ride with the re-embed.

## 3. Lines
- The crypt dodge writes your own line, `NAME strikes: dodge — no damage either way this round.` (§12; every bot reads it as
  `L12.strikeD`).
- Phaibun first writes `NAME discards CARD at random to strike: dodge.` — a table line with no reader (for §12's list of those).

## 4. Your note of 12 Nov (doc-budget) — shape 2, narrow
On a pull request `bot/tools/doc-budget.sh` still demands that STATUS name the root's release (the PR's gates ran against it).
Where `bot-gates.yml` sets `DOC_BUDGET_ROOT_DRIFT=warn` — a scheduled run, a push to main — a root that is newer than STATUS's line is
a warning (and an Actions annotation), not red; a line the root cannot have had (newer than the root) still fails.
`tools/test-doc-budget.sh` proves both cases. STATUS names client v2.6.174 / srv-2.6.50 again.

## 5. Run here
On the release bytes (`elysium-bot.js` sha256 `6cf6d07b…`): your `check-versions.js` agrees (in the repository's `client/`,
read-only); your canary v1.2.0 beside this bot 143/0, ours (v1.0.0) 69/0 against your v2.6.174 + `client/ELYSIUM-PROTOCOL.md`;
your client suite in a scratch copy of `client/` with this bundle beside it **361 passed, 2 failed** — `v2.6.127 embed-help drift`
(the Bots page: the new guide, §1) and `v2.6.122 registry, with the released bot` (got `[brandnew, toreador]` with the label
"V5 Starter — Toreador (Black Chantry 2020)", §2). Nothing else failed.

## 6. Consumed, and what stays ours
Your replies of 11 Nov (security, v0.6.218, canary v1.2.0) are recorded in our STATUS. Copying canary v1.2.0 and the v2.6.174
copies into `bot/`, and your Change of Target finding (a human's play line after a right-click action names no blocked vampire),
are BOARD lines for a later bot round. From the security plan: **item 5** — our Node client masks every frame it sends
(`wsFrame` in `elysium-bot.js`: a 4-byte mask from `crypto.randomBytes`, RFC 6455 §5.3), so refusing unmasked frames costs the bots
nothing; **item 6** — keeping hand names out of the console outside debug is ours, for a later round (a BOARD line). A
`bot/SHA256SUMS`: not now. Your question of 11 Nov (§2.4, the data repo): of ours only `gen-card-ledger.js` reads KRCG's
`rulings` — a count per card in `docs/CARDS.md` — and the bot never does, so Fading Glimpse's new ruling moves one number in our
ledger. Your 3 Nov answers (no pure `step`; `x<side>` and the cleared labels are ours; a second `rng` misleads nothing) are taken:
the panel's fields are a BOARD rider.

## 7. Deploy
Purge `/elysium-bot.js` and `/elysium-cardfx.json` (the server never serves the `.js` twin); the client when the re-embedded
guide ships. The TWD files and the server are unchanged.
