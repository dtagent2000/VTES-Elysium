# Spec to the main project — the block bar line + the rescue window (bot v0.6.127, 18 Sep 2026)

**Nothing here requires a client change.** Two log shapes to FREEZE in ELYSIUM-PROTOCOL §12, one behaviour to know about.

## 1. New bot-grammar line: the block bar
```
<b>CARD</b> — vampires cannot block this action.
```
- Regex (bot): `^(.+?) — (vampires|allies|minions) cannot block this action\.$` — m[1] the card, m[2] who is barred. Today only `vampires` is sent (Daring the Dawn).
- Sent by the ACTING bot as a plain `log` line **before** the action's frozen announce (`NAME bleeds for N.`) — the same ordering rule as `Referendum terms —`.
- Receiving bot: its block is off the table for that action (emit `block-barred`); bounce and reducers still work. The bar ends at the actor's `It resolves` or at another Methuselah's next action line.
- Human at the table: informational. If a human blocks with a vampire anyway the bot honours the table (sandbox rule) — the client MAY later grey out Block for vampires while a bar is up; optional.
- Please keep: the em dash (U+2014) and the trailing period; do not wrap the line in a `plays` sentence (it must NOT match the action-memory grammar `… plays X.`).

## 2. The client's existing rescue line now opens a block window in bots
`<b>VAMP</b> attempts to rescue a vampire from torpor.` (the action menu's line, unchanged) — without a `Target:` suffix the bots read it as an UNDIRECTED rescue of the actor's own vampire: the actor's prey, then predator, get a block window (class T4b, like a recruit). The bot sends the identical line for its own rescue, followed by the usual `Block?` ask and `It resolves`. Please keep the wording frozen.

## 3. Informational lines (no parser depends on them)
`VAMP unlocks — his referendum passed.` · `VAMP discards CARD — +1 vote for|against the referendum.` · `VAMP[, VAMP] burn(s) 1 blood to vote against — ACTOR.` · `VAMP pays for CARD — N unpreventable aggravated damage: goes to torpor[, burns 1 blood | is burned].`

## 4. For Silverson-class text on a HUMAN-called referendum
The bots read the acting vampire from `VAMP calls a political action.` — the name must be the card's name for the vote tax to be recognised.

## 5. Added in bot v0.6.128
- **`VAMP attempts to leave torpor.`** — new bot-grammar action line (+1 stealth, undirected). Bots answer Pass at once; a human may block — then the action fails with NO combat and the bot says so in a note ("a blocking vampire may diablerise instead"). If main ever adds a Leave-torpor ACTION to the menu, please use this wording.
- **The lock family:** `NAME plays CARD — locks OWNER's VAMPIRE.` is now parsed for ANY card (was Misdirection only). Anarch Troublemaker sends one line per locked vampire.
- **`give` / `given`:** the bot now SENDS `give {seat, gid, rx, ry, card:{name, kind, faceDown, locked, owner}}` (Troublemaker to its prey) and HANDLES `given` (recreates the card with the same `gid`). **Please confirm hotBridge routes `give` → `given` for bot seats in hotseat** — unchecked on this side.

## 6. Added in bot v0.6.129
- **ctrl verb `burn`** (bot-side, additive): `ctrl {cid, act:'burn'}` removes that card (and what is attached to it) from the bot's board. Please add **Burn** to the bot-element right-click menu beside Send to torpor — it is how a human completes a diablerie of a bot's vampire.
- **Own rescue is announced at +1 stealth** (rulebook); the line is unchanged.
- **A card dropped on a bot's vampire** (`give` with `attachTo`) now arms Fame / Pentex on the bot's side. Note the name: the curated Pentex entry is keyed `Pentex(TM) Subversion`; the bot accepts both spellings.
- ~~OPEN on our side: `give` without `given`~~ — CLOSED in bot v0.6.130: our bug (a seat-local card id clashed on the receiver). The server path is fine (11/11 in a live probe). **One ask remains:** a bot now always gives with a table-unique `gid` (`bot…`); if the CLIENT ever gives a card whose id is seat-local, the bot re-ids it on arrival, so a later `recall` by the old id would miss — tell us if recall-after-give to a bot matters.
