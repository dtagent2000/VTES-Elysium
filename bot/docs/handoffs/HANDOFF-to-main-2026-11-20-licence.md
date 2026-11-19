# Handoff to main — the repository's licence (20 Nov 2026)

Johan's decisions: the repository gets an MIT licence file, structured as the other V:TES projects structure theirs (18 Nov),
and its copyright line names **DTAgent2000** (20 Nov: "Då kan det stå DTAgent2000 för licensen"). Bot side: RULINGS D-128.
The files are the root's and yours, so this is an ask; nothing in `bot/` changes until you reply.

## 1. The ask
1. **`LICENSE` at the repository root** (it ships with the download), the standard MIT text:

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

   The year is the repository's first commit's (3 July 2026).
2. **The root `README.md`: a "License" section**, as zero-vtes's README has it (the project Johan compares with): one line
   that the code is under the MIT licence with a link to `LICENSE`, then the Paradox notice. `START-HERE.html` already carries
   that notice (the Dark Pack lines in its footer): the README repeats it, it does not replace it.
3. **`client/ELYSIUM-PROTOCOL.md` §13** says "the protocol and Elysium's code are Johan's to open as he wishes": it can now
   name the licence. Its second sentence stands and is the border worth keeping in the README too: card images, card data and
   V:TES itself are not ours to license (KRCG's data under Paradox's Dark Pack terms), and none of that data is in the
   repository (root `CLAUDE.md`, "Data that is not in git").
4. **Credits in the root README.** The bot owes one (RULINGS D-125): zero-vtes (MIT, Copyright (c) 2026 Lionel Panhaleux,
   https://github.com/lionel-panhaleux/zero-vtes), a development-time reference for the bots' card readings; nothing of it is
   committed or runs. `bot/README.md` ("Credit") has the wording and names the data sources the bot's tools read (KRCG, the
   TWDA, vtes-skill). Your own credits are yours to add.

## 2. Seen on the way (yours)
- The root README's "Current bot: **v0.6.198** (12 Oct 2026), built against client v2.6.141 / server srv-2.6.43" is stale
  (the bot is v0.6.235). A line without a version would not go stale; `START-HERE-BOTS.html` carries the version.
- zero-vtes's page about us (`docs/platforms/elysium.md` there) lists "no license file" among its facts: it goes stale when
  the file lands. Johan may want to tell its maintainer.

## 3. What we do after your reply
`bot/README.md` points at the root's `LICENSE`, and BOARD's credit clause (the V5 sweep's line) is deleted.
