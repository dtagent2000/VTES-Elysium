# Spec for the MAIN project — hotBridge relays for bot↔bot and human↔bot interaction, and the §12 note (11 Sep 2026)

> From the Elysium Bots project, after checking client **v2.6.90** and server **srv-2.6.35** against bot **v0.6.107**.
> Nothing here is required for v0.6.107 to run; online (server) tables already work as the bot expects
> (canary 37/0, bot suite 831/0 against srv-2.6.35). This is what the HOTSEAT bridge lacks for bots to
> interact with each other and with the human beyond their own turns — the HB2d list, made concrete.

## 1. What the bridge relays today (v2.6.90, `hotBridge`)

- client → bot seats: `joined`, `lobby`, `started`, `dealt`, `deckok`, `drew`, `turn`, and the **human's `say`** (`saySend` → every bot seat).
- bot → client: `board`, `log`, `say`, `chat`, `fx` are rendered for the human (`MP_HANDLERS.*`); `tally`/`bounty`/`openHand`… are tolerated silently.
- **Not relayed:** the human's `log` lines to bots (`mpRelay` only writes to the room socket), and a bot's `log` / `say` / `chat` / `board` / `tally` to the **other** bot seats.

Consequences at a hotseat table with two or more bots: bot A's bleed line never reaches bot B (no pending, no
block, no bounce — B never "takes" the bleed), the combat handshake between bots never happens, B1's undirected
windows never open, and a human's bleed at a bot (its `bleeds for N.` line) is not seen either. Bots still play
their own turns correctly. The A1 stash filter and B1 windows therefore currently show only on server tables.

## 2. The relay rules (mirror the server, which is the contract the bot was built against)

1. **Fan a bot's `log`, `say`, `chat`, `board`, `fx`, `tally` to every OTHER bot seat**, never back to the sender
   (`bcast(room, msg, except)` semantics: the server never echoes `log` to its sender; it DOES echo `say`, `chat`
   and `tally` to the sender — mirror both; the bot filters its own `say`/`chat` echo by `who`).
   Shapes exactly as the server sends them: `{t:'log', who, html}`, `{t:'say', who, seat, i}`,
   `{t:'chat', who, msg}`, `{t:'board', seat, who, pub}`, `{t:'fx', ...m, who, seat}`, `{t:'tally', mode, a, b, ph, rd, duel?, res?, who}`.
2. **Fan the human's `log` (`mpRelay(html)`) and `chat` to every bot seat** as `{t:'log', who: <human name>, html}` /
   `{t:'chat', who, msg}` — this is what arms a bot's pending when the human bleeds it (`NAME bleeds for N.`), and
   what lets the chat grammar (`bleed N`, `block`/`no`) work in hotseat.
3. **Roster on change** (`{t:'roster', players:[{seat,name,online,out,vp,vacant,bot}]}`) to every bot seat when a
   seat is ousted or a human leaves — the bot's ghost-prey hook (#3), hold release (#5) and per-actor prey (#2)
   read it. Today's bridge sends the roster only inside `joined`/`started`.
4. **`bounty`**: when a bot ousts (it sends `{t:'bounty'}`), give its predator `{t:'bounty', from}` and mark the
   seat `out` in the roster — the server's `bounty` handler in one line.

## 3. The §12 note (bot-emitted frozen line, new in v0.6.106)

`NAME attempts to block.` — sent as `{t:'log', html:'<b>NAME</b> attempts to block.'}` by a bot making a BARE block
attempt (the intercept-card form `NAME plays CARD: +N intercept.` already existed). Other bots parse it with
`L12.attempt = /^(.+?) attempts to block\.$/`. Backward compatible: humans see an informative log line, old
clients ignore it. Canary case: assert the regex matches the exact string the bot emits (the string lives in
`_commitBlock`, `elysium-bot.js`).

## 4. Two verifications the bot project asked for — answered from the source

- **Does the bridge echo a bot's own `log` lines back?** No — `_fromBot` `case 'log'` only renders for the human.
  The A1 handshake filter's assumption ("the server never echoes my log lines") holds in hotseat too.
- **Human client wording for undirected actions:** the client's own log for a human hunt is the bare word
  `hunts.` after the vampire (found as `'hunts.'` in the client source) — compatible with `L12.uHunt`
  (`^(.+?) hunts\.$`) once the human's `log` is relayed (rule 2). Equip / employ / recruit wording was NOT found
  in the client as `equips <b>…</b>.`-style lines; if the client logs those actions differently (or not at all), a
  bot can only see a human's hunts until the wording is aligned with §12's undirected family
  (`NAME equips CARD.` · `NAME employs CARD.` · `NAME recruits CARD [disc].`).

## 5. Nothing else changed on the contract

Server srv-2.6.32 → 2.6.35 (referee model, helper mode in the room list) touches no verb the bot uses; the
`log` relay still excludes the sender; the roster shape is unchanged. Client v2.6.90's `AVR_DEFS` line builders
still match the bot's `L12` regexes (canary 37/0).
