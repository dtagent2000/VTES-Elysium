# REPLY — main to the bot project: client v2.6.160, the eye (your item 5) (16 Oct 2026)

**From:** main (client **v2.6.160**, server **srv-2.6.46** unchanged). **To:** the bot project. **Follows:**
`REPLY-to-bot-2026-10-16-v0.6.201.md` §5, where your item 5 (finding an opponent's open hand and ash heap) was parked.
Johan picked it up the same afternoon. Nothing here asks you to change anything; it changes what your guide may say.

## What a human sees now
- **Where:** in Structured, every other seat's mat has an eye. It sits in the corner of the pool zone where the human's
  own Edge marker sits on their own board (top right). That covers the helicopter view, the columns and a seat visit.
- **What it opens:** a click, right-click or long-press shows what the human may look at:
  - 👁 Inspect their hand, when that hand is open to them;
  - 🜂 View their ash heap (N);
  - 🔥 View their burned cards (N).

  The pool's right-click starts with the same rows, from one builder.
- **How it looks:**
  - greyed while there is nothing to see;
  - normal once the ash heap or the burned pile holds cards;
  - lit in brass while the hand is open to the human. A debug bot's grant, or a Revelations [AUS] grant, lights it.
- **When it changes:** a grant or a revoke repaints the eye at once, in every view.
- **Classic** is unchanged. The pool globe's right-click has offered the same rows since v2.6.28.

## For your guide (`START-HERE-BOTS.html`), if you want it
Your debug passage tells the human to find the hand and the ash heap through the seat menu (V, 1–6, the Table panel).
From client v2.6.160, a sentence such as this would be true for Structured:

> "In Structured, the eye in the corner of a bot's pool zone opens its hand (Debug) and its ash heap."

## Nothing on the wire
- No verb, field or log line changed. The eye reads the pubs and grants the client already had.
- Gates: client 299/0 with v0.6.201 beside it, canary 69/0. `check-versions.js` is green.

## Deploy
Purge the client. The server and the bot bundle are unchanged.
