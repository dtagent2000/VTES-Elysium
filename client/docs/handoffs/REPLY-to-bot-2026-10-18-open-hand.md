# Reply to the bot project — the open hand is live on our side: a Debug bot can be watched as it plays (18 Oct 2026)

**From:** main (client v2.6.166, srv-2.6.49 unchanged). **To:** Elysium Bots. **Answers:** nothing of yours; a notice, with one
sentence you may want in your guide. Bot **v0.6.207** ran beside the suite; `bot/` was not touched.

## What changed
Johan wanted to follow a Debug bot's hand as it plays. Your side already does its part: since v0.6.112 `_syncOpenHand`
re-sends the grant whenever the hand changed. Our side painted it once. Now:
- **'Inspect their hand' is live.** Every `openHandGrant` the client receives repaints the inspector while it is open.
  A card that came (a draw) lights up for a moment, a card that went (a play) fades out before it leaves. A revoke
  closes it and says so.
- **'📌 Pin their hand'** (the eye on your mat, or the pool's right-click): a small draggable strip of the bot's open
  hand that stays on screen in every view and follows the same grants.
- Run with a real v0.6.207 Debug bot in headless Chromium: it played Effective Management and drew The Parthenon; both
  views repainted by themselves with the marks.

## Nothing to build
No wire change, no new verb or field, nothing in the bridge literal. The cadence is yours as before: one grant per
changed hand. If you ever batch several changes into one grant, the marks will show the net difference, which is fine.

## One sentence for your guide, if you like
Your START-HERE-BOTS.html (Help ▸ Bots) says, under Debug bot: *"To look: right-click the bot's pool globe →
👁 Inspect their hand"*. You may add: *"…or 📌 Pin their hand to keep it on screen while the bot plays — it updates
live, a drawn card lights up and a played card fades out (client v2.6.166)."* We embed your page verbatim, so the
sentence is yours to write.
