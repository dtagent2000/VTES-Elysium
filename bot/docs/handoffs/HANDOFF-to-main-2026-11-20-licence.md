# Handoff to main — the repository's licence (20 Nov 2026)

Johan's decisions: the repository gets an MIT licence file, structured somewhat as the other V:TES projects structure theirs
(18 Nov), and its copyright line names **DTAgent2000** (20 Nov: "Då kan det stå DTAgent2000 för licensen"). Bot side: RULINGS
D-128. The files are the root's and yours, so this is an ask; nothing in `bot/` changes until you reply. Neither of us is a
lawyer: §2 is a border to state, and its wording is Johan's.

## 1. The ask
1. **A `LICENSE` in the download**, the standard MIT text:

```
MIT License

Copyright (c) 2026 DTAgent2000

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

   The year is the repository's (created 23 June 2026). **Your gate:** a `LICENSE` at the root alone turns `check-versions.js`
   red ("root/LICENSE has no twin at client/LICENSE", tried in a scratch copy): either it lives in `client/` and is copied to
   the root as every release file (`sha256sums.js` rerun), or it joins `ROOT_ONLY` in `check-versions.js` and `sha256sums.js`.
2. **The root `README.md`: a "License" section**, as zero-vtes's README has one (MIT with a link to `LICENSE`, then the Paradox
   notice): see §2 for what ours has to say.
3. **`client/ELYSIUM-PROTOCOL.md` §13** says "the protocol and Elysium's code are Johan's to open as he wishes": it can now
   name the licence.
4. **Credits in the root README.** What the bot side owes:
   - zero-vtes (MIT, Copyright (c) 2026 Lionel Panhaleux, https://github.com/lionel-panhaleux/zero-vtes): a development-time
     reference for the bots' card readings (RULINGS D-125); nothing of it is committed or runs.
   - KRCG (static.krcg.org): the card data the bots' effect library is compiled from, and the TWDA dump behind the TWD files.
   - vtes-skill (vtes-biased, MIT): its archetype classification is in `elysium-twd-archetypes.json`; vtes-rulings (vtes-biased,
     MIT) was read for the September card sweep.

   `bot/README.md` ("Credit") has the bot's wording. Your own credits (the About dialog has KRCG and VDB) are yours.

## 2. What the MIT grant does not cover (the border to state in the README)
MIT lets anyone use and sell what it covers. That is our code and our docs. It is not:
- **the game**: card names, texts, images and V:TES itself are Paradox's, used under the Dark Pack terms (free, non-commercial,
  attribution); `START-HERE.html`'s footer, the client's About dialog and PROTOCOL §13 say so today;
- **data derived from third-party files, which IS in the repository**: `elysium-cardfx.json` / `.js` carry the cards' names,
  types, costs and requirements and the crypt's clans, disciplines and capacities beside our effect tags (their `source`:
  "vtes.json … (KRCG, Dark Pack)"), the decks are card lists, and the TWD files are statistics over VEKN's TWDA (KRCG's dump)
  with vtes-skill's classification. The raw files (`vtes.json`, the TWDA, card images) are never committed (root `CLAUDE.md`,
  "Data that is not in git").

## 3. Seen on the way (yours)
- The root README's "Current bot: **v0.6.198** (12 Oct 2026), built against client v2.6.141 / server srv-2.6.43" is stale
  (the bot is v0.6.235). A line without a version would not go stale; `START-HERE-BOTS.html` carries the version.
- zero-vtes's page about us (`docs/platforms/elysium.md` there) lists "no license file" among its facts: it goes stale when
  the file lands. Johan may want to tell its maintainer.

## 4. What we do after your reply
`bot/README.md` points at the `LICENSE`, and BOARD's credit clause (the V5 sweep's line) is deleted.
