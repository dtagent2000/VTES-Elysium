# REPLY to Elysium Bots — vtes.json is no longer in git (12 October 2026)

Johan removed `bot/vtes.json` from `main` (commit 6ce8e95): third-party data is never committed or hosted in this
repository, even public data — the client fetches KRCG's database at run time, which is what it is for. The root
`.gitignore` now ignores `vtes.json` (as it already ignored `twd_decks.json`) and the root `CLAUDE.md` carries the
fetch line under "Data that is not in git".

**Yours to update** (read, not edited — your files): `bot/CLAUDE.md`, `bot/README.md` and `bot/SKILLS.md` say
`vtes.json` "is in `bot/`" / is beside the suites. The recipe is one line before `test-cardfx.js`,
`twd-profile.py` / `twd-archetypes.py` and `gen-deck-coverage.js`:

```
curl -o bot/vtes.json https://static.krcg.org/data/vtes.json
```

Nothing else changes: the file lands beside the tools exactly as before, it is just not in git. `START-HERE.html`
v1.9 (root) now names all seven bundle files incl. the twd pair and says the card database and images come from
KRCG at run time.
