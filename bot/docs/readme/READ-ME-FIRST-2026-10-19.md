# Elysium Bots — delivery 19 October 2026: bot v0.6.207 → **v0.6.208** (`FX_NORM` client-identical again) — DEPLOY CANDIDATE

**What it is.** Main's `client/docs/handoffs/REPLY-to-bot-2026-10-19-norm-letters.md`, built as suggested. Johan saw
*Przemysław, War Beast* render blank; client v2.6.167 fixed its `norm()`, and the bot's `FX_NORM` had the same gap.
Johan's "kör" 19 Oct 11:01. This file holds only what changed; v0.6.207's READ-ME-FIRST
(`READ-ME-FIRST-2026-10-17b.md`) stands for everything else.

## 1. The fault
`FX_NORM` folded accents with `normalize('NFD')` and then stripped `[^a-z0-9]`. NFD splits é into e + a mark, but
ł ø œ æ ß đ ð þ ı are letters of their own: NFD leaves them, and the strip deleted them.
- **Inside the bot it was consistent:** `normIdx` and the lookup lost the same letter, so a deck that typed the printed
  letter still hit (tier 1 or 2 of `fxLookup`).
- **A deck typing the plain-letter spelling missed all three tiers:** *Przemyslaw, War Beast*, *Boleslaw Gutowski*,
  *Clara Hjortshoj*, *Sacre-Coeur Cathedral, France*. A miss means capacity 3 (the fallback), no clan, no fx, and the
  card is never played.
- The client finds those cards since v2.6.167, so the two halves disagreed about the same deck.

## 2. The fix
`FX_NORM_LETTERS` (the client's `NORM_LETTERS`, 16 entries) and one `replace` ahead of `.normalize('NFD')`. The
transliteration is KRCG's (ł→l, ø→o, œ→oe, æ→ae, ß→ss, đ/ð→d, þ→th, ı→i). `prepCardfx` rebuilds `normIdx` at load, so
`elysium-cardfx.json` is unchanged.

**Not done (main's optional point, parked):** the TWD profile's and archetypes' lookups (`P.cards[c]`, `s0.cards[c]`)
are exact-key on the shown name. That is not about these letters, and nobody has measured whether it matters in play.

## 3. Tests: section 154 (6)
- **154a** the four KRCG keys; **154b** each of the 16 letters transliterates;
- **154c** the plain spellings hit `fxLookup`; **154d** the printed spellings still hit;
- **154e** an uncontrolled Przemyslaw typed plain gets capacity 6 (Clara Hjortshoj 5), not the fallback 3;
- **154f** `FX_NORM` equals the released client's own `norm()` on all 6,576 names in cardfx. It lifts `NORM_LETTERS`
  and `norm()` out of `../elysium-vtes-bord.html` (the monorepo root; then `bot/`'s own copy, which is older and has no
  table). Without a v2.6.167+ client beside the suite it prints *skipped* and does not count.

Destructively, on the v0.6.207 `elysium-bot.js` (the same suite file, the root client beside it): 1/5. 154d is green
by design (the printed spellings worked before); 154a, b, c, e and f are red.

## 4. Gates (on the release bytes)
@@GATES@@

## 5. Release
`BOT_VERSION` 0.6.208; the v0.6.207 note stays in the CHANGELOG (it was written there at its release), the v0.6.208
entry is on top. The handshake in `bot/CLAUDE.md`, the context, the learnings, `SKILLS.md` ('Card-name keys'), the
journal and `docs/START-HERE-BOTS-CHAT.md` are updated. `START-HERE-BOTS.html`: version chip and footer only. The bundle
is copied to the root. Handoff: `docs/handoffs/HANDOFF-to-main-2026-10-19-v0_6_208.md` (nothing for main to build;
re-embed the guide).

## 6. Next (unchanged from v0.6.207, in Johan's order)
- Consume main's replies not yet read in a bot round: v0.6.206, v0.6.207, robustness (17 Oct), open hand (18 Oct).
- The 14 Oct scenario in `client/playtest/` with `--dir` on a scratch copy of the root, against the report's numbers.
- The larger re-measure, against a baseline run on the current release.
- Parked: the profile's exact-key lookups (§2).
