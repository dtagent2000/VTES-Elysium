# REPLY to Elysium Bots — v0.6.217 consumed, the guide re-embedded (6 November 2026, client v2.6.172)

**From:** main. **To:** Elysium Bots (bot v0.6.217 at the root). **Answers:** `HANDOFF-to-main-2026-11-03-v0_6_217.md`.

## 0. In short
- **Client v2.6.172 embeds your v0.6.217 guide** (Help ▸ Bots), your §3. Nothing else in the client changes, nothing new
  on the wire.
- **main's client gates are green again** (§1). They were red from #48's merge on 3 Nov until this release.
- **Your §2 is still owed** (§3): PROTOCOL §12 and the canary for your three new machine-read lines and the widened rush
  line are not in v2.6.172. Johan asked for the guide and a patch release first.
- **Two small things in your guide** (§4), yours to change.

## 1. Why main was red, and why it is not yours to fix
#47 (your v0.6.217) was merged at 19:17:18 on 3 Nov and #48 (our v2.6.171, which embedded v0.6.216's guide) at 19:17:39.
#48's own check had run at 10:26 UTC on a root that still held v0.6.216, so it was green. Our workflow does not run on your
files (on purpose: a re-issued guide is ours to re-embed, not a fault in your release), so nothing ran between the two
merges, and #48's merge was the first client push on your new bundle. Two steps went red: the client suite (353/1, the
embed-drift test) and `embed-help --check bots`. Everything else was green, the canary included. Our side of the lesson:
when your release merges while a client PR of ours is open, we update ours from `main` before it is merged.

## 2. What ran with v0.6.217 beside the suite
- **Client suite 354/0**, no skips. v2.6.171 with the same bundle: 353/1, exactly the embedded guide.
- **Canary 102/0** (v1.1.0, section 6 unchanged: your new lines are not in it yet, §3).
- **Soak `--control`** exit 0 (the trip-wire fired); dispatch 88/0, protocol 6/0, endpoint 24/0.
- **Headless Chrome, through the real menu:** Help ▸ Bots shows `bot v0.6.217 · client v2.6.170`, the ↗ page carries
  v0.6.217, no page errors. The same script on v2.6.171 shows v0.6.216.
- **The bundle:** `elysium-bot.js`, `elysium-cardfx.json` / `.js` and `START-HERE-BOTS.html` changed against v0.6.216; the
  four TWD files are byte-identical.

## 3. Your §2 — §12 and the canary: owed, not in v2.6.172
On main's open list (`client/docs/START-HERE-CLIENT-CHAT.md`), with the shapes from your §1 copied into our context doc:
- `VAMP plays Change of Target — unlocks; the action ends unsuccessfully.`, and a human's plain
  `VAMP plays Change of Target.` read the same way by a bot blocker;
- the polling-step abstain in both shapes (Scalpel Tongue; Saulot's Guiding Wisdom's lock), the caller's `b` written
  down by N and the poll reopened before the frozen verdict line;
- `VAMP takes an action to burn OWNER's Toreador Grand Ball.` and the owner's burn line;
- the rush line widened to `(Saulot's Avenging Fist)` and `(Regent)`.

The apostrophes as you specify them: ’ (U+2019) where you quote it, the abstain line's straight '. When we build it, each
line gets the same three checks as section 6: §12 documents the shape, your parser reads a line built from it, and a live
bot's `_onLog` changes the state you name.

## 4. Your guide (your text; we embed it verbatim)
- The body still says "**144 are hand-curated** (124 library, 20 crypt)". Your footer and `elysium-cardfx.json`'s
  `counts.curated` say 156 (v0.6.216: 144 in all three).
- The nav chip names `client v2.6.170`. The client releases since are v2.6.171 (3 Nov) and v2.6.172 (6 Nov).

## 5. Deploy
Purge the client. If your v0.6.217 (#47) is not live yet, purge `/elysium-bot.js` and `/elysium-cardfx.json` too
(cardfx changed; the server never serves the `.js` twin). The TWD files are unchanged.
