# Elysium Bots — delivery 15 October 2026: bot v0.6.198 → **v0.6.199** (R0 of the play-test review) — DEPLOY CANDIDATE

**What it is.** Main's rig played a full game against two bots on 14 Oct (PR #13) and sent 24 points. All of them are reviewed in `docs/reviews/REVIEW-playtest-2026-10-14.md`, each with the code line, a fix and a round:
- 16 bot bugs and one side find;
- 2 tempo points;
- 2 points on decisions or card data;
- 1 cosmetic point;
- 1 point that is rules-correct (the stolen blood);
- 2 points of praise.

This delivery is R0, the groundwork Johan said "kör" to.

## 1. A placement always returns
- **The problem** (main's Classic review, 13 Oct, the one hard stop). On a Classic table `slot()` clamps a row at the felt's edge. Once the row's 4–11 distinct points were held, `_openSlot` never returned: a socket bot's process spun, and a lobby bot froze the host's whole tab.
- **The fix.** The scan stops after 200 indices. A full row then stacks the next card round its points, fanned toward the table's middle and kept on the felt (`_stackSlot`). A freed point is taken first again.
- Structured is unchanged byte for byte. Bots still sit at Structured tables only (Johan).

## 2. The guide (START-HERE-BOTS.html)
- Main's two sentences (§F):
  - you manage your own pool, blood, costs and Edge;
  - playing a card books nothing on the counter.
- The panel's Release hold frees only the bot on its row; It resolves frees them all.
- "Curated to 100 %" corrected. 99 cards are curated, and four V5 masters do nothing for the bot yet: Guardian Angel, Haven Uncovered and The Labyrinth (Nosferatu), and Wasserschloss Anif (Tremere).
- The taken line is a report: take the blood off yourself.
- **Debug bot:**
  - tick it before Add bot;
  - see its hand and ash heap from its pool globe's menu (on a Structured table: the overview V, a seat visit 1–6, or the Table panel);
  - its open hand also reaches the other bots;
  - offline, the hand item is missing in client v2.6.158.

## 3. Live copies, and data
- **The read-only copies** are client v2.6.158, srv-2.6.46 and protocol v2.6.158. One suite fixture had relied on a stealth tally surviving a turn change; srv-2.6.42+ clears it, so the fixture now announces in the action's turn.
- **Third-party data** (KRCG `vtes.json`, the TWDA) comes from the source. When the sandbox cannot reach the source, it comes from the private repo `dtagent2000/VTES-Elysium-data`.
- **Format:** KRCG's v5 `vtes.json` is a different format, which the compiler does not read; keep v3. The TWDA's VDB-style file is `twda-vdb.json`.
- `bot/.gitignore` keeps the TWDA files and stray coverage reports out of git.

## 4. Two tester reports (15 Oct)
- **"I cannot see the bots' hands or ash heaps in debug mode"** (offline or on a private server).
  - The bot's side works.
  - Offline, the client never offers the hand: `openHandCardsFor` reads the placeholder board of a bot seat.
  - Two more client items make the Debug box claim Tournament mode.
  - The ash heap works but is hard to find.
  - The client items are in `HANDOFF-to-main-2026-10-15-v0_6_199.md`. The bot items go to R1: `--debug` on the command line with a Tournament refusal, and the open hand sent only to human seats.
- **"Odd discards"** (Tremere threw away Theft of Vitae and then had no strike).
  - With no ready vampire the whole hand counts as dead, and the first card goes (point 22).
  - Every Tremere vampire has [tha], so Theft of Vitae is "dead" only then.
  - Fixed in R1.

## Gates
| Gate | Result |
| --- | --- |
| suite | **1942/0** ×3 on srv-2.6.46 (section 138 is new, 9 assertions) |
| section 138 against v0.6.198 | 7 red: the child process is killed, the suite does not hang. The two Structured guards are green on both. |
| canary | 57/0 against v2.6.158 |
| hotseat | 10/0 against v2.6.158 |
| HB1 | 11/0 |
| test-cardfx | 261/0, including no drift on the data repo's `vtes.json` |
| `node --check` | every changed file |

No line is over 4000 characters.

## For main
- Send `HANDOFF-to-main-2026-10-15-v0_6_199.md`.
- Deploy `elysium-bot.js` v0.6.199 and re-embed `START-HERE-BOTS.html`. The cardfx and twd files are unchanged.
- No wire change.

## Next
R1. Johan's open answers are listed at the end of the review:
1. the order of rounds;
2. pacing bot-vs-bot combat when a human is seated;
3. Adaptive's skip under Standard;
4. one spokesbot for the pool question;
5. Haven Uncovered;
6. who runs the rig.
