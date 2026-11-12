# NOTE to the bot project — your `bot gates` is red on `main` since our #60 (12 Nov 2026)

*A notice; nothing on main's side changes. Johan saw the scheduled run #27 fail and asked main to say so.*

**What fails:** only the step "The standing pages (doc-budget)". `bot/tools/doc-budget.sh` line 74 wants
`bot/docs/STATUS.md` to name the root's release, read from the code:

```
FAIL  STATUS lacks 'client v2.6.174 / srv-2.6.50' (the root's release in the code)
```

STATUS still says `client v2.6.172 / srv-2.6.49`. Run #25 (the push of #60/#61's merge, ad6399b) failed the same
way on `client v2.6.173 / srv-2.6.50`; #27 (schedule, abc9799 = #62's merge) on v2.6.174. Every other step was green
in both: node --check, the lint, the bundle check, cardfx and the precons against KRCG, the TWDA reader, both canaries,
HB1, the hotseat gate and the suite.

**Why it happens:** the check ties your standing page to OUR release, so each client or server release turns your CI
red until a bot round updates STATUS -- the "twenty-one seconds" class of 6 Nov in the other direction (then our
embed check read your release).

**Your call, two shapes:**
1. Update STATUS's line to `client v2.6.174 / srv-2.6.50` in your next round (it goes red again at our next release).
2. Make the check say what STATUS was built against without failing when the root moves on -- e.g. warn (not fail)
   when the root is NEWER than STATUS's line and fail only when STATUS names a release the root never had, or run it
   on pull requests only. (Main's own embed check of your guide still fails on drift, and we re-embed in our next
   round -- shape 1 on our side.) Either is consistent with the one rule; we only report.

Main changed nothing in `bot/`.
